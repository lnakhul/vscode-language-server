import logging
import sandra
from typing import TypedDict, Literal, List, NotRequired
from vscode.rpc_service.base import BaseRpcService
import pathlib

logger = logging.getLogger(__name__)

class CopyRenameParameters(TypedDict):
    operation: Literal['rename', 'directory_rename']
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

                if (new_obj := self.db.readobj(new_path)):
                    type_id = new_obj.TYPE_ID
                    existing_new_object_type = 'Directory' if type_id == 2 else f'UNKNOWN type with {type_id}'
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



=================================

async renameHomedirsDirectory(filePath: string): Promise<void> {
        const oldUri = vscode.Uri.parse(`sandra:${filePath}`);
        const oldSandraPath = SandraFileSystemProvider.parseSandraPath(oldUri);
        const parentPath = path.posix.dirname(oldSandraPath);
        const oldName = path.posix.basename(oldSandraPath);
        const newName = await vscode.window.showInputBox({ prompt: 'Enter new name', value: oldName });
        if (!newName) return;
        const newPath = path.posix.join(parentPath, newName);
        const response = await this.proxyManager.sendRequest<boolean>(null, 'file:renameDirectory', [oldSandraPath], [newPath]);
        if (response) {
            vscode.window.showInformationMessage(`Renamed to: ${newName}`);
        } else {
            vscode.window.showErrorMessage(`Failed to rename ${oldName}`);
        }
        this.signalFilesChanged([oldUri], vscode.FileChangeType.Changed);
    }

====================================



def _rename_paths(self, old_paths: List[str], new_paths: List[str], is_directory: bool):
    """
    Handles renaming of files or directories in Sandra.
    """
    operation = 'directory_rename' if is_directory else 'rename'
    with self.srcdb.transaction('Renaming paths'):
        for old_path, new_path in zip(old_paths, new_paths):
            original_obj = self.srcdb.readobj(old_path)
            if not original_obj:
                raise RuntimeError(f"{old_path} does not exist.")

            if is_directory and original_obj.TYPE_ID != 2:
                raise RuntimeError(f"{old_path} is not a directory.")

            if not is_directory and original_obj.TYPE_ID != 4:
                raise RuntimeError(f"{old_path} is not a file.")

            if self.srcdb.readobj(new_path):
                raise RuntimeError(f"{new_path} already exists.")

            # Rename the object
            original_obj.rename(new_path)


def handle_rename(self, oldPaths: List[str], newPaths: List[str], is_directory: bool) -> bool:
    """
    Handles renaming in the user homedirs.
    """
    try:
        self._rename_paths(oldPaths, newPaths, is_directory)
        return True
    except Exception as e:
        logger.error(f"Failed to rename {oldPaths} to {newPaths}: {str(e)}")
        return False


==================================



async renameHomedirsDirectory(filePath: string): Promise<void> {
    const newName = await vscode.window.showInputBox({
        prompt: 'Enter new name',
        value: path.basename(filePath),
    });

    if (!newName) return;

    const newPath = path.join(path.dirname(filePath), newName);

    await vscode.window.withProgress(
        {
            title: `Renaming ${filePath} to ${newPath}...`,
            location: vscode.ProgressLocation.Notification,
        },
        async (progress, token) => {
            const response = await this.proxyManager.sendRequest<boolean>(
                token,
                'file:rename',
                { oldPaths: [filePath], newPaths: [newPath], is_directory: true }
            );

            if (response) {
                vscode.window.showInformationMessage(`Renamed ${filePath} to ${newPath}`);
            } else {
                vscode.window.showErrorMessage(`Failed to rename ${filePath}`);
            }
        }
    );
}


===================

def flatten_homedirs(self, homedirs: List[dict], parent_path: str = '') -> List[str]:
        """Flattens the hierarchical structure of homedirs into a list of paths."""
        paths = []
        for dir in homedirs:
            current_path = f"{parent_path}/{dir['name']}".strip('/')
            paths.append(current_path)
            if 'subfolders' in dir and dir['subfolders']:
                paths.extend(self.flatten_homedirs(dir['subfolders'], current_path))
        return paths

    async def handle_autocompletePath(self, prefix: str, max_entries: int = 0):
        homedirs = self.handle_listHomedirs()
        all_paths = self.flatten_homedirs(homedirs)
        results = [path for path in all_paths if path.startswith(prefix)]
        if max_entries:
            results = results[:max_entries]
        logger.info(f"Autocomplete results for prefix '{prefix}': {results}")
        return results



=====================

async showInputBoxWithAutocomplete(prompt: string): Promise<string | undefined> {
    const quickPick = vscode.window.createQuickPick();
    quickPick.placeholder = prompt;
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    quickPick.onDidChangeValue(async (value) => {
        if (!value.trim()) {
            quickPick.items = [];
            return;
        }

        const suggestions = await this.proxyManager.sendRequest<string[]>(null, 'file:autocompletePath', value, 10);
        console.log(`Autocomplete suggestions for '${value}':`, suggestions);

        quickPick.items = suggestions.map(dir => ({ label: dir }));
    });

    return new Promise((resolve) => {
        quickPick.onDidAccept(() => {
            resolve(quickPick.selectedItems[0]?.label);
            quickPick.hide();
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    });
}
