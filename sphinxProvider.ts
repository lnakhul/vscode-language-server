public async showInWebView(uri: vscode.Uri, title: string): Promise<void> {
    const htmlPath = path.join(this._extensionPath, 'media', 'sphinx.html');
    const htmlDir = path.dirname(htmlPath);
    const htmlContent = await fs.promises.readFile(htmlPath, 'utf-8');
    const webviewPanel = this.reactView.openLocalHtml(htmlPath, {
        title: title,
        identifier: 'sphinx',
        localResourceRoots: [vscode.Uri.file(htmlDir)]
    });
    webviewPanel.webview.html = htmlContent.replace(
        /<head>/,
        `<head><meta http-equiv="Content-Security-Policy" content="default-src 'self' data:; img-src 'self' data:; media-src 'self' data:; script-src 'unsafe-inline' 'self'; style-src 'unsafe-inline' 'self';">`
    );

    webviewPanel.webview.onDidReceiveMessage((message) => {
        if (message.type === 'sphinx') {
            const uriString = message.content;
            const uri = vscode.Uri.parse(uriString);
            this._onDidOpenResource.fire(uri);
        }
    });

    const content = await vscode.workspace.fs.readFile(uri);
    const contentType = mime.getType(uri.fsPath) || 'text/plain';
    const stream = Stream.Readable.from(content);
    const { port } = this._httpServer.connectionInfo!;
    const url = this._httpServer._localUri(port, `/${uri.fsPath}`);
    webviewPanel.webview.postMessage({ type: 'sphinx', content: url.toString() });

    this._httpServer.registerContentProvider(uri.fsPath, async () => {
        return { stream, contentType };
    });
}

------------------------------------------------------------------

private async showInWebView(filePath: string): Promise<void> {
    const content = await fetchLocalFile(filePath);
    const htmlPath = path.join(path.dirname(filePath), 'index.html');
    await fs.promises.writeFile(htmlPath, content);

    // Copy the assets to the same directory as the HTML file
    const htmlDir = path.dirname(htmlPath);
    const assetsDir = path.join(htmlDir, '_static');
    await fs.promises.mkdir(assetsDir, { recursive: true });
    const assets = await fs.promises.readdir(path.join(path.dirname(filePath), '_build', 'html', '_static'));
    await Promise.all(assets.map(async (asset) => {
        const assetPath = path.join(path.dirname(filePath), '_build', 'html', '_static', asset);
        const assetDestPath = path.join(assetsDir, asset);
        await fs.promises.copyFile(assetPath, assetDestPath);
    }));

    // Update the paths in the HTML file to use absolute paths
    const htmlContent = await fs.promises.readFile(htmlPath, 'utf8');
    const updatedHtmlContent = htmlContent.replace(/(href|src)="(?!https?:\/\/)(?!data:)(?!#)([^"]*)"/g, `$1="${path.join(htmlDir, '$2')}"`);
    await fs.promises.writeFile(htmlPath, updatedHtmlContent);

    const webviewPanel = this.reactView.openLocalHtml(htmlPath, { title: 'Sphinx Documentation', identifier: 'sphinx' });
    const panel = await webviewPanel;
    if (panel) {
        const uriString = panel.webview.asWebviewUri(vscode.Uri.file(htmlPath));
        panel.webview.postMessage({ type: 'sphinx', content: uriString });
        panel.webview.html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource} data:; script-src ${panel.webview.cspSource} 'unsafe-inline'; style-src ${panel.webview.cspSource} 'unsafe-inline';">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sphinx Documentation</title>
                </head>
                <body>
                    <iframe src="${uriString}" style="width: 100%; height: 100%; border: none;"></iframe>
                </body>
            </html>
        `;
    }
}