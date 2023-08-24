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
