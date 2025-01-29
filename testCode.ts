# file_service.py
import logging
import sandra
import pathlib
from vscode.rpc_service.base import BaseRpcService

logger = logging.getLogger(__name__)

class FileService(BaseRpcService):
    PREFIX = 'file'
    
    def __init__(self, globals, control_thread):
        super().__init__(globals, control_thread)
        self.db = sandra.connect(f"homedirs/home/{sandra.USERNAME}")
        
    def handle_listDirectory(self, params):
        path = params.get('path', f"/homedirs/home/{sandra.USERNAME}")
        try:
            items = []
            for name in sandra.nameRange(dirname=path, db=self.db):
                full_path = sandra.join(path, name)
                meta = self.db.readmeta(full_path)
                items.append({
                    'path': full_path,
                    'isDir': meta.is_directory
                })
            return items
        except Exception as e:
            logger.error(f"Directory listing failed: {str(e)}")
            raise RuntimeError("Failed to list directory contents")

    def handle_delete(self, params):
        path = params['path']
        try:
            if 'staging' in path:
                meta = self.db.readmeta(path)
                if meta.owner != sandra.USERNAME:
                    return False
                    
            self.db.delete(path)
            return True
        except Exception as e:
            logger.error(f"Delete failed: {str(e)}")
            raise RuntimeError("Delete operation failed")

    def handle_rename(self, params):
        old_path = params['oldPath']
        new_path = params['newPath']
        try:
            self.db.rename(old_path, new_path)
            return True
        except Exception as e:
            logger.error(f"Rename failed: {str(e)}")
            raise RuntimeError("Rename operation failed")

    def handle_validateStaging(self, params):
        path = params['path']
        try:
            meta = self.db.readmeta(path)
            return meta.owner == sandra.USERNAME
        except Exception as e:
            logger.error(f"Validation failed: {str(e)}")
            return False



======================
import logging
import sandra
from vscode.rpc_service.base import BaseRpcService
import pathlib

logger = logging.getLogger(__name__)

class FileManagerService(BaseRpcService):
    """File Manager proxy service for handling file operations in Sandra."""
    
    PREFIX = 'fileManager'
    stateless = True
    
    def __init__(self, globals, control_thread):
        super().__init__(globals, control_thread)
        self.db = sandra.connect(f"homedirs/home/{sandra.USERNAME}")

    def handle_listHomedirs(self) -> list:
        """Lists all folders in the homedirs directory."""
        try:
            folders = [path for path in sandra.walk("homedirs", db=self.db, returnDirs=True)]
            return folders
        except Exception as e:
            logger.error(f"Failed to list homedirs: {str(e)}")
            return []

    def handle_listFiles(self, folder: str) -> list:
        """Lists all files in the specified folder within homedirs."""
        try:
            files = [file for file in sandra.walk(folder, db=self.db, returnDirs=False)]
            return files
        except Exception as e:
            logger.error(f"Failed to list files in {folder}: {str(e)}")
            return []

    def handle_rename(self, oldPath: str, newPath: str) -> bool:
        """Renames a file or folder in Sandra."""
        try:
            obj = self.db.readobj(oldPath)
            if obj:
                obj.rename(newPath)
                return True
        except Exception as e:
            logger.error(f"Failed to rename: {str(e)}")
            return False

    def handle_delete(self, filePath: str) -> bool:
        """Deletes a file or folder in Sandra."""
        try:
            obj = self.db.readobj(filePath)
            if obj:
                obj.delete()
                return True
        except Exception as e:
            logger.error(f"Failed to delete file: {str(e)}")
            return False

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

=====================================


import logging
import sandra
from vscode.rpc_service.base import BaseRpcService
import pathlib

logger = logging.getLogger(__name__)

class FileManagerService(BaseRpcService):
    """File Manager proxy service for handling file operations in Sandra."""
    
    PREFIX = 'fileManager'
    stateless = True
    
    def __init__(self, globals, control_thread):
        super().__init__(globals, control_thread)
        self.db = sandra.connect(f"homedirs/home/{sandra.USERNAME}")

    def handle_listHomedirs(self) -> list:
        """Lists all folders in the homedirs directory."""
        try:
            folders = [path for path in sandra.walk("homedirs", db=self.db, returnDirs=True)]
            return folders
        except Exception as e:
            logger.error(f"Failed to list homedirs: {str(e)}")
            return []

    def handle_listFiles(self, folder: str) -> list:
        """Lists all files in the specified folder within homedirs."""
        try:
            files = [file for file in sandra.walk(folder, db=self.db, returnDirs=False)]
            return files
        except Exception as e:
            logger.error(f"Failed to list files in {folder}: {str(e)}")
            return []

    def handle_rename(self, oldPath: str, newPath: str) -> bool:
        """Renames a file or folder in Sandra."""
        try:
            obj = self.db.readobj(oldPath)
            if obj:
                obj.rename(newPath)
                return True
        except Exception as e:
            logger.error(f"Failed to rename: {str(e)}")
            return False

    def handle_delete(self, filePath: str) -> bool:
        """Deletes a file or folder in Sandra."""
        try:
            obj = self.db.readobj(filePath)
            if obj:
                obj.delete()
                return True
        except Exception as e:
            logger.error(f"Failed to delete file: {str(e)}")
            return False

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
