public async generateSphinxDocsChoice(): Promise<void> {
        const selection = await vscode.window.showQuickPick(
            [
                { label: 'Generate in WebView', value: 'webview' },
                { label: 'Generate in Browser', value: 'browser' }
            ],
            {
                placeHolder: 'How would you like to generate the Sphinx doc?'
            }
        );
        if (!selection) return;
        await vscode.commands.executeCommand(
            selection.value === 'webview' ? 'quartz.generateSphinxDocs' : 'quartz.generateSphinxDocsInBrowser'
        );
    }
