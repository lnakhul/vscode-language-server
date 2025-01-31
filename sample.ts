def handle_listHomedirs(self) -> list:
    """Lists all folders in the homedirs directory recursively."""
    try:
        folders = []
        def list_dirs(dir_path):
            for name in sandra.nameRange(dirname=dir_path, db=self.db):
                full_path = str(pathlib.Path(dir_path) / name)
                obj = self.db.readobj(full_path)
                # Assuming obj.type exists; adjust according to the library's API
                if obj and getattr(obj, 'type', None) == 'directory':
                    folders.append(full_path)
                    list_dirs(full_path)  # Recurse into subdirectory
        list_dirs('/')
        return folders
    except Exception as e:
        logger.error(f"Failed to list homedirs: {str(e)}")
        return []


private async listHomedirsFolder(): Promise<void> {
    const folders = await this.proxyManager.sendRequest<string[]>(null, 'file:listHomedirs', {});
    if (!folders) return;

    // Create QuickPick items with indentation
    const items = folders.map(folderPath => {
        const parts = folderPath.split('/').filter(part => part !== ''); // Split into components
        const depth = parts.length;
        const indentation = '  '.repeat(depth - 1); // Indent based on depth
        const label = `${indentation}📁 ${parts[parts.length - 1]}`; // Show folder icon and name
        return {
            label: label,
            description: folderPath, // Store the full path in description
        };
    });

    // Show quick pick with hierarchical items
    const selectedItem = await vscode.window.showQuickPick(items, {
        title: 'Select a folder to manage',
        placeHolder: 'Choose a folder',
    });

    if (selectedItem) {
        this.manageFileActions(selectedItem.description!);
    }
}



=================================

import vscode from 'vscode';
import * as path from 'path';
import { Trash } from './uitls';
import { ProxyManager } from './proxyManager';
import { simpleCreateQuickPick } from './commonPickers';

interface Folder {
    name: string;
    subfolders: Folder[];
}

export class FileManager implements vscode.Disposable {
    // ... (existing properties and constructor remain unchanged)

    private async listHomedirsFolder(): Promise<void> {
        const folders = await this.proxyManager.sendRequest<Folder[]>(null, 'file:listHomedirs');
        if (!folders) return;
        await this.showFolderQuickPick(folders, 'Select a folder to manage');
    }

    private async showFolderQuickPick(
        folders: Folder[],
        title: string,
        currentPath: string = ''
    ): Promise<void> {
        // Create a mapping from indented labels to folder objects
        const folderMap = new Map<string, Folder>();
        const choices = folders.map(folder => {
            // Calculate indentation based on current depth
            const depth = currentPath.split('/').filter(p => p !== '').length;
            const indentation = '  '.repeat(depth);
            const label = `${indentation}📁 ${folder.name}`;
            folderMap.set(label, folder);
            return label;
        });

        // Show hierarchical quick pick
        const selectedLabel = await simpleCreateQuickPick({
            choices,
            title,
            allowUserChoice: false,
            errorMessage: 'No folder selected'
        });

        if (!selectedLabel) return;

        // Retrieve the folder object from the label
        const selectedFolder = folderMap.get(selectedLabel);
        if (!selectedFolder) {
            vscode.window.showErrorMessage('Selected folder not found.');
            return;
        }

        // Build the full path
        const newPath = path.join(currentPath, selectedFolder.name);

        if (selectedFolder.subfolders.length > 0) {
            // Recursively show subfolders with updated path
            await this.showFolderQuickPick(
                selectedFolder.subfolders,
                `Select a subfolder in ${selectedFolder.name}`,
                newPath
            );
        } else {
            // Pass full path to actions
            await this.manageFileActions(newPath);
        }
    }

    // ... (rest of the class remains unchanged)
}


==============================

def handle_listHomedirs(self) -> list:
    """Lists folders with their subfolders in a hierarchical structure."""
    try:
        root_path = "/"
        folders = []

        # Get all directories recursively
        for dir_path in sandra.walk(root=root_path, db=self.db, returnDirs=True, recurse=True):
            # Skip the root directory itself
            if dir_path == root_path:
                continue
            
            # Split the path into components (e.g., "/memory/python" → ["memory", "python"])
            parts = [p for p in dir_path.strip("/").split("/") if p]
            
            # Build the hierarchical structure
            current_level = folders
            for part in parts:
                # Check if the folder already exists in the current level
                existing = next((f for f in current_level if f["name"] == part), None)
                if existing:
                    current_level = existing["subfolders"]
                else:
                    new_folder = {"name": part, "subfolders": []}
                    current_level.append(new_folder)
                    current_level = new_folder["subfolders"]

        logger.info(f"Hierarchy: {folders}")
        return folders

    except Exception as e:
        logger.error(f"Failed to list homedirs: {str(e)}")
        return []



================================


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
