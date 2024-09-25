async revealElement(element?: vscode.Uri): Promise<void> {
    const sandraPath = this.sourceDataProvider.uriToSandraPath(element);

    if (sandraPath) {
        let entry = await this.treeDataProvider.findEntryElement(sandraPath);

        if (!entry) {
            entry = this.treeDataProvider.pathEntries.get(sandraPath);
            if (!entry) return;  // If no entry is found, exit
        }

        try {
            // First, focus on the Source Cache Explorer view
            await vscode.commands.executeCommand('quartz.srcCacheExplorer.focus', { preserveFocus: true });

            // Use setImmediate to ensure the reveal happens after the view is fully focused
            setImmediate(async () => {
                try {
                    // Expand the entire tree and reveal the file
                    await this.treeView.reveal(entry, { focus: true, expand: true });
                } catch (revealError) {
                    console.error('Error revealing file in Source Cache Explorer:', revealError);
                    vscode.window.showErrorMessage(`Failed to reveal file: ${sandraPath}`);
                }
            });

        } catch (error) {
            console.error('Error focusing Source Cache Explorer:', error);
            vscode.window.showErrorMessage('Failed to focus Source Cache Explorer.');
        }
    }
}
