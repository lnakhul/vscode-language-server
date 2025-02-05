import logging
import sandra
from vscode.rpc_service.base import BaseRpcService
import pathlib

logger = logging.getLogger(__name__)

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

    def handle_rename(self, parentPath: str, oldName: str, newName: str) -> bool:
        """Renames a file or folder in Sandra."""
        try:
            oldPath = f"{parentPath}/{oldName}"
            newPath = f"{parentPath}/{newName}"
            obj = self.db.readobj(oldPath)
            if obj:
                obj.rename(newPath)
                return True
        except Exception as e:
            logger.error(f"Failed to rename: {str(e)}")
            return False

import * as vscode from 'vscode';
import * as path from 'path';
import { Trash } from './utils';
import { ProxyManager } from './proxyManager';
import { simpleCreateQuickPick } from './commonPickers';
import { SandraFileSystemProvider } from './SandraFsProvider';

interface HomedirsStructure {
    name: string;
    subdirectories: HomedirsStructure[];
}

export class FileManager implements vscode.Disposable {
    private trash: Trash;
    private fileChangeEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private watchedUris = new Map<string, any>();

    constructor(private proxyManager: ProxyManager) {
        this.trash = new Trash(...this.register());
    }

    *register(): Generator<vscode.Disposable> {
        yield vscode.commands.registerCommand('quartz.deleteFile', this.deleteHomedirsDirectory, this);
        yield vscode.commands.registerCommand('quartz.renameFile', this.renameHomedirsDirectory, this);
        yield vscode.commands.registerCommand('quartz.deleteFolderContents', this.deleteFolderContents, this);
        yield vscode.commands.registerCommand('quartz.showFileTree', this.listHomedirsDirectories, this);
    }

    async listHomedirsDirectories(): Promise<void> {
        const homedirsDirectories: HomedirsStructure[] = await this.proxyManager.sendRequest<HomedirsStructure[]>(null, 'file:listHomedirs');
        if (!homedirsDirectories || homedirsDirectories.length === 0) return;
        await this.showHomedirsDirectoryTreeHierarcy(homedirsDirectories, 'Select a folder to manage');
    }

    async showHomedirsDirectoryTreeHierarcy(homedirsDirectories: HomedirsStructure[], title: string, parentPath: string = ''): Promise<void> {
        const choices = homedirsDirectories.map(directory => directory.name);
        
        const selectedDirectoryName = await simpleCreateQuickPick({
            choices,
            title,
            allowUserChoice: false,
            errorMessage: 'No folder selected'
        });

        if (!selectedDirectoryName) return;
        const selectedDirectory = homedirsDirectories.find(directory => directory.name === selectedDirectoryName);
        if (!selectedDirectory) return;

        const fullPath = path.posix.join(parentPath, selectedDirectoryName);

        selectedDirectory.subdirectories = selectedDirectory.subdirectories || [];
        if (selectedDirectory.subdirectories.length) {
            await this.showHomedirsDirectoryTreeHierarcy(selectedDirectory.subdirectories, `Select a folder to manage in ${selectedDirectoryName}`, fullPath);
        } else {
            await this.manageFileActions(fullPath);
        }
    }

    async manageFileActions(filePath: string): Promise<void> {
        const choices = ['Delete', 'Rename'];
        const action = await simpleCreateQuickPick({
            choices,
            title: 'Select an action',
            allowUserChoice: false,
            errorMessage: 'No action selected'
        });
        if (!action) return;

        switch (action) {
            case 'Delete':
                await this.deleteHomedirsDirectory(filePath);
                break;
            case 'Rename':
                await this.renameHomedirsDirectory(filePath);
                break;
        }
    }

    async deleteHomedirsDirectory(filePath: string): Promise<void> {
        const uri = vscode.Uri.parse(`sandra:${filePath}`);
        const sandraPath = SandraFileSystemProvider.parseSandraPath(uri);
        const response = await this.proxyManager.sendRequest<boolean>(null, 'file:delete', sandraPath, true);
        if (!response) {
            const proceed = await vscode.window.showWarningMessage(`Are you sure you want to delete ${filePath}?`, {modal: true}, 'Yes', 'No');
            if (proceed === 'Yes') {
                await this.proxyManager.sendRequest<boolean>(null, 'file:delete', sandraPath, true);
                vscode.window.showInformationMessage(`Deleted: ${filePath}`);
            } else {
                vscode.window.showInformationMessage(`Deletion of ${filePath} cancelled`);
            }
        } else {
            vscode.window.showInformationMessage(`Deleted: ${filePath}`);
        }
        this.signalFilesChanged([uri], vscode.FileChangeType.Deleted);
    }

    async deleteFolderContents(): Promise<void> {
        const folderPath = await vscode.window.showInputBox({ prompt: 'Enter the folder path to delete contents' });
        if (!folderPath) return;
        const uri = vscode.Uri.parse(`sandra:${folderPath}`);
        const sandraPath = SandraFileSystemProvider.parseSandraPath(uri);
        const response = await this.proxyManager.sendRequest<boolean>(null, 'file:deleteFolderContents', sandraPath);
        if (response) {
            vscode.window.showInformationMessage(`Contents of ${folderPath} deleted`);
        } else {
            vscode.window.showErrorMessage(`Failed to delete contents of ${folderPath}`);
        }
        this.signalFilesChanged([uri], vscode.FileChangeType.Changed);
    }

    async renameHomedirsDirectory(filePath: string): Promise<void> {
        const oldUri = vscode.Uri.parse(`sandra:${filePath}`);
        const oldSandraPath = SandraFileSystemProvider.parseSandraPath(oldUri);
        const parentPath = path.posix.dirname(oldSandraPath);
        const oldName = path.posix.basename(oldSandraPath);
        const newName = await vscode.window.showInputBox({ prompt: 'Enter new name', value: oldName });
        if (!newName) return;
        const response = await this.proxyManager.sendRequest<boolean>(null, 'file:rename', parentPath, oldName, newName);
        if (response) {
            vscode.window.showInformationMessage(`Renamed to: ${newName}`);
        } else {
            vscode.window.showErrorMessage(`Failed to rename ${oldName}`);
        }
        this.signalFilesChanged([oldUri], vscode.FileChangeType.Changed);
    }

    private uriToKey(uri: vscode.Uri): string {
        return uri.toString(true);
    }

    private signalFilesChanged(uris: vscode.Uri[], changeType: vscode.FileChangeType): void {
        const matched = [];
        for (const uri of uris) {
            if (uri.scheme === 'sandra') {
                const options = this.watchedUris.get(this.uriToKey(uri));
                if (options) {
                    // TODO: handle recursive and exclude options
                    matched.push(uri);
                }
            }
        }

        if (matched.length) {
            this.fileChanged(matched, changeType);
        }
    }

    private fileChanged(uris: vscode.Uri[], changeType: vscode.FileChangeType): void {
        this.fileChangeEmitter.fire(
            uris.map(uri => ({ type: changeType, uri }))
        );
    }

    dispose(): void {
        this.trash.dispose();
    }
}    


===================================================================


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
        rmtree(uri.path, db=self.db, dryRun=False)
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
