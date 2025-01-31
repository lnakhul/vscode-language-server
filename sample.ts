def _list_folders(self, path: str) -> list:
        """Recursively lists all folders in the given path."""
        folders = []
        for name in sandra.nameRange(expand=False, dirname=path, db=self.db, types=['Directory']):
            sub_path = f"{path}/{name}"
            subfolders = self._list_folders(sub_path)
            folders.append({'name': name, 'subfolders': subfolders})
        return folders

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

