
// fileManagement.ts
import * as vscode from 'vscode';
import { ProxyManager } from './proxyManager';
import { sandra } from './sandraWrapper';

export class FileManagement {
    private proxyManager: ProxyManager;

    constructor(proxyManager: ProxyManager) {
        this.proxyManager = proxyManager;
        this.registerCommands();
    }

    private registerCommands() {
        vscode.commands.registerCommand('quartz.deleteFile', () => this.deleteFile());
        vscode.commands.registerCommand('quartz.renameFile', () => this.renameFile());
        vscode.commands.registerCommand('quartz.moveFile', () => this.moveFile());
    }

    private async selectFile(placeholder: string): Promise<string | undefined> {
        const items = await this.listHomedirsFiles();
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: placeholder,
            ignoreFocusOut: true
        });
        return selected?.path;
    }

    private async listHomedirsFiles(): Promise<Array<vscode.QuickPickItem & { path: string }>> {
        try {
            const files = await this.proxyManager.sendRequest<Array<{ path: string, isDir: boolean }>>(
                'file:listDirectory',
                { path: `/homedirs/home/${sandra.USERNAME}` }
            );
            
            return files.map(file => ({
                label: path.basename(file.path),
                description: file.isDir ? '📁 Folder' : '📄 File',
                path: file.path
            }));
        } catch (error) {
            vscode.window.showErrorMessage('Failed to list directory contents');
            return [];
        }
    }

    async deleteFile(): Promise<void> {
        const path = await this.selectFile('Select file or folder to delete');
        if (!path) return;

        try {
            if (path.includes('/staging')) {
                const isValid = await this.proxyManager.sendRequest<boolean>(
                    'file:validateStaging',
                    { path }
                );
                
                if (!isValid) {
                    vscode.window.showWarningMessage('Cannot delete staging area: Ownership validation failed');
                    return;
                }
            }

            await this.proxyManager.sendRequest('file:delete', { path });
            vscode.window.showInformationMessage('Successfully deleted item');
        } catch (error) {
            vscode.window.showErrorMessage(`Delete failed: ${error.message}`);
        }
    }

    async renameFile(): Promise<void> {
        const oldPath = await this.selectFile('Select file or folder to rename');
        if (!oldPath) return;

        const newName = await vscode.window.showInputBox({
            prompt: 'Enter new name',
            value: path.basename(oldPath),
            validateInput: value => value.includes('/') ? 'Name cannot contain slashes' : null
        });

        if (newName) {
            try {
                const newPath = path.join(path.dirname(oldPath), newName);
                await this.proxyManager.sendRequest('file:rename', { oldPath, newPath });
                vscode.window.showInformationMessage('Successfully renamed item');
            } catch (error) {
                vscode.window.showErrorMessage(`Rename failed: ${error.message}`);
            }
        }
    }

    async moveFile(): Promise<void> {
        const oldPath = await this.selectFile('Select file or folder to move');
        if (!oldPath) return;

        const newLocation = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Select destination folder',
            defaultUri: vscode.Uri.file(path.dirname(oldPath))
        });

        if (newLocation && newLocation[0]) {
            try {
                const newPath = path.join(newLocation[0].fsPath, path.basename(oldPath));
                await this.proxyManager.sendRequest('file:rename', { oldPath, newPath });
                vscode.window.showInformationMessage('Successfully moved item');
            } catch (error) {
                vscode.window.showErrorMessage(`Move failed: ${error.message}`);
            }
        }
    }
}
