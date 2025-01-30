def handle_listHomedirs(self) -> list:
        """Lists all folders in the homedirs directory."""
        try:
            logger.info('Listing homedirs')
            root_path = f"home/{sandra.USERNAME}"
            folders = self._list_folders(root_path)
            logger.info(f'Found folders: {folders}')
            return folders
        except Exception as e:
            logger.error(f"Failed to list homedirs: {str(e)}")
            return []

    def _list_folders(self, path: str) -> dict:
        """Recursively lists all folders in the given path."""
        folders = {}
        for name in sandra.nameRange(expand=False, dirname=path, db=self.db, types=['Directory']):
            sub_path = f"{path}/{name}"
            folders[name] = self._list_folders(sub_path)
        return folders


=====================

private async listHomedirsFolder(): Promise<void> {
        const folders = await this.proxyManager.sendRequest<{ [key: string]: any }>(null, 'file:listHomedirs', {});
        if (!folders) return;
        await this.showFolderQuickPick(folders, 'Select a folder to manage');
    }

    private async showFolderQuickPick(folders: { [key: string]: any }, title: string): Promise<void> {
        const choices = Object.keys(folders);
        const selectedFolder = await simpleCreateQuickPick({
            choices,
            title,
            allowUserChoice: false,
            errorMessage: 'No folder selected'
        });
        if (selectedFolder) {
            if (Object.keys(folders[selectedFolder]).length > 0) {
                await this.showFolderQuickPick(folders[selectedFolder], `Select a subfolder in ${selectedFolder}`);
            } else {
                this.manageFileActions(selectedFolder);
            }
        }
    }
