import logging
import sandra
from typing import TypedDict, Literal, List, NotRequired
from vscode.rpc_service.base import BaseRpcService
import pathlib

logger = logging.getLogger(__name__)

class CopyRenameParameters(TypedDict):
    operation: Literal['rename', 'copy', 'directory_copy', 'directory_rename']
    original_paths: List[str]
    new_paths: List[str]
    pull_up_original_on_rename: NotRequired[bool]

class FileManagerService(BaseRpcService):
    """File Manager proxy service for handling file operations in Sandra."""
    
    PREFIX = 'file'
    stateless = True
    
    def __init__(self, globals, control_thread):
        super().__init__(globals, control_thread)
        self.db = sandra.connect(f"homedirs/home/{sandra.USERNAME}")

    def handle_listHomedirs(self) -> list:
        """Lists all folders and their subdirectories in a hierarchical structure."""
        try:
            root_path = "/"
            folder_tree = {}

            # Sandra's walk to get a hierarchical structure of directories
            for folder in sandra.walk(root=root_path, db=self.db, returnDirs=True, recurse=True):
                parts = folder.strip("/").split("/")
                current_level = folder_tree

                # Traverse the hierarchy to insert subdirectories
                for part in parts:
                    if part not in current_level:
                        current_level[part] = {}
                    current_level = current_level[part]

            # Convert dictionary format to list format expected by frontend
            def convert_tree_to_list(tree):
                return [{"name": key, "subfolders": convert_tree_to_list(value)} for key, value in tree.items()]

            folder_list = convert_tree_to_list(folder_tree)
            logger.info(f"Retrieved folder structure: {folder_list}")
            return folder_list

        except Exception as e:
            logger.error(f"Failed to list homedirs: {str(e)}")
            return []

    def handle_renameDirectory(self, old_paths: List[str], new_paths: List[str]) -> bool:
        """Renames a directory in Sandra."""
        try:
            self._copy_paths(CopyRenameParameters(
                original_paths=old_paths,
                new_paths=new_paths,
                operation='directory_rename'
            ))
            return True
        except Exception as e:
            logger.error(f"Failed to rename directory: {str(e)}")
            return False

    def _copy_paths(self, parameters: CopyRenameParameters):
        """
        Copy with pymodule is different - you don't want to copy everything,
        just the text, and you don't want to copy the previous object's vcInfo.
        Set the modified flag to true.
        """
        operation = parameters['operation']
        original_paths = parameters['original_paths']
        new_paths = parameters['new_paths']
        
        # If the object user is renaming doesn't exist in front, that means there is a backing object.
        # If the user specifies pull up to the front, we will do that, and the user can decide to delete it later.
        pull_up = parameters.get('pull_up_original_on_rename', False)
        operation_identifier = 'Directory' if operation.startswith('directory') else 'File'

        # Wrap everything in a Sandra transaction
        with self.db.transaction('Copying files') as trans:
            for original_path, new_path in zip(original_paths, new_paths):
                if not (original_obj := self.db.readobj(original_path)):
                    raise RuntimeError(f"Can't complete {operation}, {original_path} doesn't exist in the current environment")

                # Checking the correct types are there.
                original_type_id = original_obj.TYPE_ID
                if operation.startswith('directory') and original_type_id != 2:
                    raise RuntimeError(f"Can't complete {operation}, {original_path} is not a directory")

                if not operation.startswith('directory') and original_type_id != 4:
                    raise RuntimeError(f"Can't complete {operation}, {original_path} is not a PyModule")

                if (new_obj := self.db.readobj(new_path)):
                    type_id = new_obj.TYPE_ID
                    existing_new_object_type = 'PyModule' if type_id == 4 else ('Directory' if type_id == 2 else f'UNKNOWN type with {type_id}')
                    raise RuntimeError(f"Can't complete {operation}, An object with type {existing_new_object_type} already exists at {new_path}")

                if operation.startswith('directory'):
                    copy_tree_contents = self.conn.copy_tree(original_path, srcdb=self.db, destdb=self.db, destPath=new_path)
                    copied_files = copy_tree_contents[0]
                    for obj in sandra.readObjects(copied_files, db=self.db):
                        obj.modified = True
                        obj.vcInfo = VCInfo()  # Reset vcInfo.

                    # By definition of rename, you should delete this.
                    if operation == 'directory rename':
                        if (first_db_obj := self.db.readobj(original_path)):
                            self.conn.rmtree(original_path, self.db)
                        if not first_db_obj and pull_up:
                            self.conn.copy_tree(original_path, srcdb=self.db, destdb=self.db)

                # Copying a single PyModule object
                else:
                    dirname = self.db.splitPath(new_path)[0]
                    self.db.mkdir(dirname)
                    new_module = PyModule(self.db, new_path)
                    new_module.text = original_obj.text
                    new_module.modified = True
                    new_module.write()

                if operation == 'rename':
                    if (first_db_obj := self.db.readobj(original_path)):
                        self.db.delete(original_path)
                    if not first_db_obj and pull_up:
                        self.conn.copy_from_backing_dbs(self.globals.qzenvuri, self.db, pathlib.PurePosixPath(original_path))

    def handle_delete(self, uriStr: str, recursive: bool) -> bool:
        """Recursively deletes all objects inside a directory and then deletes the directory itself in Sandra."""
        from qz.sandra.utils import rmtree
        from urllib.parse import urlparse

        uri = urlparse(uriStr)
        if recursive:
            raise IOError("Recursive delete not supported")
        self.db.delete(uri.path)
        return True

    def handle_deleteFolderContents(self, uriStr: str) -> bool:
        """Deletes all objects inside a directory in Sandra."""
        from qz.sandra.utils import rmtree
        from urllib.parse import urlparse

        uri = urlparse(uriStr)
        directory_path = uri.path

        # Get all objects inside the directory
        objects = sandra.readObjects(directory_path, db=self.db)
        for obj in objects:
            obj.delete()

        return True

    def handle_move(self, oldPath: str, newPath: str) -> bool:
        """Moves a file or folder in Sandra."""
        try:
            obj = self.db.readobj(oldPath)
            if obj:
                obj.rename(newPath)
                return True
        except Exception as e:
            logger.error(f"Failed to move file: {str(e)}")
            return False
    
    def handle_validateUser(self, filePath: str) -> bool:
        """Validates if the staging area was created by the current user."""
        obj = self.db.readobj(filePath)
        if obj and obj.meta.get('created_by') == sandra.USERNAME:
            return True
        return False
