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



===========================
import * as vscode from 'vscode';
import { ProxyManager } from './proxyManager';
import * as path from 'path';
import { simpleCreateQuickPick, PickerArgs } from './utils';

export class FileManager {
    private proxyManager: ProxyManager;

    constructor(proxyManager: ProxyManager) {
        this.proxyManager = proxyManager;
        this.registerCommands();
    }

    private registerCommands(): void {
        vscode.commands.registerCommand('quartz.fileManager.rename', this.renameFile.bind(this));
        vscode.commands.registerCommand('quartz.fileManager.delete', this.deleteFile.bind(this));
        vscode.commands.registerCommand('quartz.fileManager.move', this.moveFile.bind(this));
        vscode.commands.registerCommand('quartz.fileManager.listHomedirs', this.listHomedirs.bind(this));
    }

private async listHomedirs(): Promise<void> {
        const folders = await this.proxyManager.sendRequest('fileManager:listHomedirs', {});
        if (!folders || folders.length === 0) {
            vscode.window.showInformationMessage('No folders found in homedirs.');
            return;
        }

        const args: PickerArgs<string> = {
            currentSelection: '',
            choices: folders,
            title: 'Select a Folder',
            errorMessage: 'Invalid selection',
        };

        const selectedFolder = await simpleCreateQuickPick(args);
        if (!selectedFolder) return;

        const files = await this.proxyManager.sendRequest('fileManager:listFiles', { folder: selectedFolder });
        if (!files || files.length === 0) {
            vscode.window.showInformationMessage(`No files found in ${selectedFolder}.`);
            return;
        }

        const fileArgs: PickerArgs<string> = {
            currentSelection: '',
            choices: files,
            title: `Files in ${selectedFolder}`,
            errorMessage: 'Invalid selection',
        };

        await simpleCreateQuickPick(fileArgs);
    }

    private async renameFile(): Promise<void> {
        const fileUri = await vscode.window.showOpenDialog({ canSelectMany: false, openLabel: 'Select file to rename' });
        if (!fileUri || fileUri.length === 0) return;

        const newName = await vscode.window.showInputBox({ prompt: 'Enter new file name' });
        if (!newName) return;

        const oldPath = fileUri[0].fsPath;
        const newPath = path.join(path.dirname(oldPath), newName);

        const result = await this.proxyManager.sendRequest('fileManager:rename', { oldPath, newPath });
        if (result) {
            vscode.window.showInformationMessage(`Renamed to ${newName}`);
        } else {
            vscode.window.showErrorMessage('Failed to rename file');
        }
    }

    private async deleteFile(): Promise<void> {
        const fileUri = await vscode.window.showOpenDialog({ canSelectMany: false, openLabel: 'Select file to delete' });
        if (!fileUri || fileUri.length === 0) return;

        const confirm = await vscode.window.showWarningMessage('Are you sure you want to delete this file?', 'Yes', 'No');
        if (confirm !== 'Yes') return;

        const filePath = fileUri[0].fsPath;
        const isUserValid = await this.proxyManager.sendRequest('fileManager:validateUser', { filePath });
        if (!isUserValid) {
            vscode.window.showErrorMessage('Cannot delete: Staging area validation failed.');
            return;
        }

        const result = await this.proxyManager.sendRequest('fileManager:delete', { filePath });
        if (result) {
            vscode.window.showInformationMessage('File deleted successfully');
        } else {
            vscode.window.showErrorMessage('Failed to delete file');
        }
    }

    private async moveFile(): Promise<void> {
        const fileUri = await vscode.window.showOpenDialog({ canSelectMany: false, openLabel: 'Select file to move' });
        if (!fileUri || fileUri.length === 0) return;

        const destinationUri = await vscode.window.showOpenDialog({ canSelectFolders: true, openLabel: 'Select destination folder' });
        if (!destinationUri || destinationUri.length === 0) return;

        const oldPath = fileUri[0].fsPath;
        const newPath = path.join(destinationUri[0].fsPath, path.basename(oldPath));

        const args: PickerArgs<string> = {
            currentSelection: newPath,
            choices: [newPath],
            title: 'Confirm Move',
            errorMessage: 'Invalid selection',
        };

        const userSelection = await simpleCreateQuickPick(args);
        if (!userSelection) return;

        const result = await this.proxyManager.sendRequest('fileManager:move', { oldPath, newPath });
        if (result) {
            vscode.window.showInformationMessage('File moved successfully');
        } else {
            vscode.window.showErrorMessage('Failed to move file');
        }
    }
}



==================================

import vscode from 'vscode';
import * as path from 'path';
import { ProxyManager } from './proxyManager';
import { simpleCreateQuickPick } from './commonPickers';

export class FileManager implements vscode.Disposable {
    private proxyManager: ProxyManager;
    private fileWatcher: vscode.FileSystemWatcher;

    constructor(proxyManager: ProxyManager) {
        this.proxyManager = proxyManager;
        this.registerCommands();
        this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
    }

    private registerCommands(): void {
        vscode.commands.registerCommand('extension.deleteFile', this.deleteFile, this);
        vscode.commands.registerCommand('extension.renameFile', this.renameFile, this);
        vscode.commands.registerCommand('extension.moveFile', this.moveFile, this);
        vscode.commands.registerCommand('extension.showFileTree', this.showFileTree, this);
    }

    private async showFileTree(): Promise<void> {
        const files = await this.proxyManager.sendRequest<string[]>(null, 'file:listFiles', {});
        vscode.window.showQuickPick(files, { placeHolder: 'Select a file to manage' }).then(selected => {
            if (selected) {
                this.manageFileActions(selected);
            }
        });
    }

    private async manageFileActions(filePath: string): Promise<void> {
        const choices = ['Delete', 'Rename', 'Move'];
        const action = await vscode.window.showQuickPick(choices, { placeHolder: 'Select an action' });
        if (!action) return;

        switch (action) {
            case 'Delete':
                this.deleteFile(filePath);
                break;
            case 'Rename':
                this.renameFile(filePath);
                break;
            case 'Move':
                this.moveFile(filePath);
                break;
        }
    }

    private async deleteFile(filePath: string): Promise<void> {
        if (!this.validateStagingArea(filePath)) {
            vscode.window.showWarningMessage('Staging area validation failed. Cannot delete.');
            return;
        }
        await this.proxyManager.sendRequest(null, 'file:delete', { filePath });
        vscode.window.showInformationMessage(`Deleted: ${filePath}`);
    }

    private async renameFile(filePath: string): Promise<void> {
        const newName = await vscode.window.showInputBox({ prompt: 'Enter new file name' });
        if (!newName) return;
        const newFilePath = path.join(path.dirname(filePath), newName);
        await this.proxyManager.sendRequest(null, 'file:rename', { filePath, newFilePath });
        vscode.window.showInformationMessage(`Renamed to: ${newFilePath}`);
    }

    private async moveFile(filePath: string): Promise<void> {
        const newLocation = await vscode.window.showInputBox({ prompt: 'Enter new location' });
        if (!newLocation) return;
        const newFilePath = path.join(newLocation, path.basename(filePath));
        await this.proxyManager.sendRequest(null, 'file:move', { filePath, newFilePath });
        vscode.window.showInformationMessage(`Moved to: ${newFilePath}`);
    }

    private validateStagingArea(filePath: string): boolean {
        const user = this.getCurrentUser();
        return filePath.includes(`homedirs/${user}/staging_area`);
    }

    private getCurrentUser(): string {
        return process.env.USER || process.env.USERNAME || 'unknown';
    }

    dispose(): void {
        this.fileWatcher.dispose();
    }
}


# file_service.py
import logging
import sandra
from datetime import datetime
from typing import List, Dict
from vscode.rpc_service.base import BaseRpcService

logger = logging.getLogger(__name__)

class FileService(BaseRpcService):
    PREFIX = 'file'
    
    def __init__(self, globals, control_thread):
        super().__init__(globals, control_thread)
        self.db = sandra.connect(f"homedirs/home/{sandra.USERNAME}")
        
    def handle_listDirectory(self, params: Dict) -> List[Dict]:
        try:
            path = params.get('path', f"/homedirs/home/{sandra.USERNAME}")
            items = []
            
            for name in sandra.nameRange(dirname=path, db=self.db):
                full_path = sandra.join(path, name)
                meta = self.db.readmeta(full_path)
                
                items.append({
                    'path': full_path,
                    'isDirectory': meta.is_directory,
                    'name': name,
                    'modified': datetime.fromtimestamp(meta.modified_time).isoformat() if meta.modified_time else None,
                    'size': meta.size if not meta.is_directory else 0
                })
            
            return items
            
        except Exception as e:
            logger.error(f"Directory listing failed: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to list directory: {str(e)}")

    def handle_readFile(self, params: Dict) -> str:
        path = params['path']
        try:
            obj = self.db.readobj(path)
            return obj.data if hasattr(obj, 'data') else ''
        except Exception as e:
            logger.error(f"File read failed: {str(e)}")
            raise RuntimeError(f"Failed to read file: {path}")
