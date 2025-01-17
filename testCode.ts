content = content.replace(
  /<\/body>/i,
  `<script>
    document.addEventListener('DOMContentLoaded', function() {
      const vsCodeApi = window.acquireVsCodeApi?.();
      // For any link whose href starts with http/https (i.e., external)
      document.querySelectorAll('a[href^="http"]').forEach(a => {
        a.addEventListener('click', (evt) => {
          evt.preventDefault();   // Stop iframe navigation
          if (vsCodeApi) {
            vsCodeApi.postMessage({
              type: 'command',
              command: 'openExternal',
              args: [ a.href ]
            });
          }
        });
      });
    });
  </script>
  </body>`
);

private addTitleToLinks(content: string): string {
    return content.replace(
        /<a\b([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*)>/gi,
        (fullMatch, beforeHref, theHref, afterHref) =>
            /\btitle\s*=/i.test(fullMatch) ? fullMatch : `<a ${beforeHref}href="${theHref}" title="${theHref}"${afterHref}>`
    );
}


public async viewSphinxSource(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const { document } = editor;
        const { uri } = document;
        const sandraPath = this.sourceLocator.uriToSandraPath(uri);

        if (!sandraPath || document.languageId !== 'restructuredtext') {
            vscode.window.showErrorMessage('The active editor is not an RST file.');
            return;
        }

        const sourcePath = path.join(path.dirname(sandraPath), 'index.rst');
        const sourceUri = vscode.Uri.file(sourcePath);

        try {
            const doc = await vscode.workspace.openTextDocument(sourceUri);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open source file: ${error.message}`);
        }
    }
