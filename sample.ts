def handle_listHomedirs(self) -> list:
        """Lists all folders in the homedirs directory."""
        try:
            folders = []
            for name in sandra.nameRange(dirname='/', db=self.db):
                folders.append(name)
            return folders
        except Exception as e:
            logger.error(f"Failed to list homedirs: {str(e)}")
            return []

==========================================

def handle_deleteDirectory(self, dirPath: str, force: bool = False) -> bool:
        """Deletes a directory in Sandra. If the directory is not empty, it can optionally clear the directory before deleting."""
        try:
            # Check if the directory is empty
            contents = list(sandra.walk(root=dirPath, db=self.db, returnDirs=True, recurse=False))
            if contents and not force:
                return False  # Directory is not empty and force is not set

            # If force is set, clear the directory
            if contents and force:
                for item in contents:
                    obj = self.db.readobj(item)
                    if obj:
                        obj.delete()

            # Delete the directory itself
            dir_obj = self.db.readobj(dirPath)
            if dir_obj:
                dir_obj.delete()
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete directory: {str(e)}")
            return False


============================

private async deleteFile(filePath: string): Promise<void> {
        if (!this.validateStagingArea(filePath)) {
            vscode.window.showWarningMessage('Staging area validation failed. Cannot delete.');
            return;
        }

        const response = await this.proxyManager.sendRequest<boolean>(null, 'file:deleteDirectory', { dirPath: filePath, force: false });
        if (!response) {
            const proceed = await vscode.window.showWarningMessage('Directory is not empty. Do you want to clear it and proceed?', { modal: true }, 'Yes', 'No');
            if (proceed === 'Yes') {
                await this.proxyManager.sendRequest<boolean>(null, 'file:deleteDirectory', { dirPath: filePath, force: true });
                vscode.window.showInformationMessage(`Cleared and deleted: ${filePath}`);
            } else {
                vscode.window.showInformationMessage('Deletion cancelled.');
            }
        } else {
            vscode.window.showInformationMessage(`Deleted: ${filePath}`);
        }
    }


==========================def handle_listHomedirs(self) -> list:
    """Lists only directories (folders and subfolders) in the homedirs directory."""
    try:
        def get_subfolders(base_path):
            subfolders = []
            for name in sandra.nameRange(dirname=base_path, db=self.db, types=["Directory"]):  # Ensure only directories
                full_path = f"{base_path}/{name}"
                subfolders.append({
                    "name": name,
                    "subfolders": get_subfolders(full_path)  # Recursively get subfolders
                })
            return subfolders

        root_path = "/"
        folders = []
        for name in sandra.nameRange(dirname=root_path, db=self.db, types=["Directory"]):  # Filter for directories only
            full_path = f"{root_path}/{name}"
            folders.append({
                "name": name,
                "subfolders": get_subfolders(full_path)
            })

        logger.info(f"Filtered folders for frontend: {folders}")
        return folders
    except Exception as e:
        logger.error(f"Failed to list homedirs: {str(e)}")
        return []


+==============================

def handle_delete(self, filePath: str, force: bool = False) -> bool:
        """Recursively deletes all objects inside a directory and then deletes the directory itself in Sandra."""
        try:
            def delete_contents(path):
                contents = sandra.nameRange(dirname=path, db=self.db)
                for item in contents:
                    full_path = f"{path}/{item}"
                    obj = self.db.readobj(full_path)
                    if obj:
                        if obj.type == "Directory":
                            delete_contents(full_path)
                        obj.delete()

            delete_contents(filePath)

            # Check if the directory is empty and delete it
            remaining_objects = sandra.nameRange(dirname=filePath, db=self.db)
            if not remaining_objects or force:
                dir_obj = self.db.readobj(filePath)
                if dir_obj:
                    dir_obj.delete()
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete directory: {str(e)}")
            return False



======================================

import vscode from 'vscode';
import { FileManager } from './fileManager';
import { MockProxyManager } from './mocks/proxyManager';
import { expect, jest, test, describe, beforeEach, afterEach } from '@jest/globals';
import { MockInstanceStore } from './utils';
import { container, cleanupTestContainer, prepareTestContainers } from './testDi';

jest.mock("../../logging");

describe('FileManager Test Suite', () => {
    let fileManager: FileManager;
    let proxyManager: MockProxyManager;
    const mockedInstances = new MockInstanceStore();

    beforeAll(() => {
        prepareTestContainers();
        proxyManager = new MockProxyManager();
    });

    afterAll(() => {
        cleanupTestContainer();
        jest.clearAllMocks();
    });

    beforeEach(() => {
        fileManager = new FileManager(proxyManager);
    });

    afterEach(() => {
        mockedInstances.restore();
        jest.clearAllMocks();
    });

    describe('listHomedirsDirectories', () => {
        test('should handle empty directory response', async () => {
            proxyManager.nextResponse('file:listHomedirs', []);
            await fileManager.listHomedirsDirectories();
            expect(proxyManager.sendRequest).toHaveBeenCalledWith(
                null, 
                'file:listHomedirs',
                undefined
            );
        });

        test('should process valid directory structure', async () => {
            const mockDirs = [
                { 
                    name: "test", 
                    subdirectories: [
                        { name: "subdir", subdirectories: [] }
                    ]
                }
            ];
            
            proxyManager.nextResponse('file:listHomedirs', mockDirs);
            const showSpy = mockedInstances.spyOn(fileManager, 'showHomedirsDirectoryTreeHierarcy');
            
            await fileManager.listHomedirsDirectories();
            
            expect(showSpy).toHaveBeenCalledWith(
                mockDirs,
                'Select a folder to manage'
            );
        });
    });

    describe('showHomedirsDirectoryTreeHierarcy', () => {
        test('should handle directory selection', async () => {
            const mockDirs = [
                { name: "dir1", subdirectories: [] },
                { name: "dir2", subdirectories: [] }
            ];
            
            mockedInstances.mockImplementation('simpleCreateQuickPick', () => 'dir1');
            const manageSpy = mockedInstances.spyOn(fileManager, 'manageFileActions');
            
            await fileManager.showHomedirsDirectoryTreeHierarcy(mockDirs, 'Test Title');
            
            expect(manageSpy).toHaveBeenCalledWith('dir1');
        });

        test('should handle nested directories', async () => {
            const mockDirs = [
                { 
                    name: "parent",
                    subdirectories: [
                        { name: "child", subdirectories: [] }
                    ]
                }
            ];
            
            mockedInstances.mockImplementationSequence('simpleCreateQuickPick', ['parent', 'child']);
            const manageSpy = mockedInstances.spyOn(fileManager, 'manageFileActions');
            
            await fileManager.showHomedirsDirectoryTreeHierarcy(mockDirs, 'Test Title');
            
            expect(manageSpy).toHaveBeenCalledWith('child');
        });
    });

    describe('deleteHomedirsDirectory', () => {
        test('should handle successful deletion', async () => {
            proxyManager.nextResponse('file:delete', true);
            const showInfoSpy = jest.spyOn(vscode.window, 'showInformationMessage');
            
            await fileManager.deleteHomedirsDirectory('/test/path');
            
            expect(showInfoSpy).toHaveBeenCalledWith('Deleted: /test/path');
        });

        test('should handle force deletion', async () => {
            proxyManager.nextResponse('file:delete', false);
            mockedInstances.mockImplementation('showWarningMessage', () => 'Yes');
            
            await fileManager.deleteHomedirsDirectory('/test/path');
            
            expect(proxyManager.sendRequest).toHaveBeenCalledWith(
                null,
                'file:delete',
                { dirPath: '/test/path', force: true }
            );
        });
    });

    describe('moveHomedirsDirectory', () => {
        test('should handle valid move operation', async () => {
            mockedInstances.mockImplementation('showInputBox', () => '/new/location');
            proxyManager.nextResponse('file:move', true);
            const showInfoSpy = jest.spyOn(vscode.window, 'showInformationMessage');
            
            await fileManager.moveHomedirsDirectory('/old/path');
            
            expect(showInfoSpy).toHaveBeenCalledWith('Moved to: /new/location');
            expect(proxyManager.sendRequest).toHaveBeenCalledWith(
                null,
                'file:move',
                '/old/path',
                '/new/location'
            );
        });

        test('should cancel on empty location', async () => {
            mockedInstances.mockImplementation('showInputBox', () => undefined);
            const sendSpy = jest.spyOn(proxyManager, 'sendRequest');
            
            await fileManager.moveHomedirsDirectory('/old/path');
            
            expect(sendSpy).not.toHaveBeenCalled();
        });
    });

    describe('manageFileActions', () => {
        test('should handle delete action', async () => {
            mockedInstances.mockImplementation('simpleCreateQuickPick', () => 'Delete');
            const deleteSpy = mockedInstances.spyOn(fileManager, 'deleteHomedirsDirectory');
            
            await fileManager.manageFileActions('/test/path');
            
            expect(deleteSpy).toHaveBeenCalledWith('/test/path');
        });

        test('should handle move action', async () => {
            mockedInstances.mockImplementation('simpleCreateQuickPick', () => 'Move');
            const moveSpy = mockedInstances.spyOn(fileManager, 'moveHomedirsDirectory');
            
            await fileManager.manageFileActions('/test/path');
            
            expect(moveSpy).toHaveBeenCalledWith('/test/path');
        });
    });

    describe('dispose', () => {
        test('should dispose resources', () => {
            const disposeSpy = jest.spyOn(fileManager['trash'], 'dispose');
            fileManager.dispose();
            expect(disposeSpy).toHaveBeenCalled();
        });
    });
});
