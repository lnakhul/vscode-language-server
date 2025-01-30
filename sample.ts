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
