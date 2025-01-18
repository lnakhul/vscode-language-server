// (Inside loadHtmlContent, after rewriting anchors, etc.)
content = content.replace(
  /<\/body>/i,
  `<script>
     document.addEventListener('contextmenu', function(evt) {
       evt.preventDefault();
       // Instead of a real menu, let's just do something:
       const vsCodeApi = window.acquireVsCodeApi();
       vsCodeApi.postMessage({
         type: 'command',
         command: 'viewGeneratedSource',
         args: ['${localPath}']
       });
     }, false);
   </script>
   </body>`
);





configureWebviewPanelContext(panel: vscode.WebviewView, context: ReactWebviewPanelContext): void {
  context.onCommand('viewGeneratedSource', async (localPath: string) => {
    // Look up the final HTML for localPath. Then open a text editor:
    const finalHtml = this.reactService.httpServer.getFinalHtml(localPath);
    if (!finalHtml) {
      vscode.window.showErrorMessage(`No final HTML found for ${localPath}`);
      return;
    }
    const doc = await vscode.workspace.openTextDocument({
      content: finalHtml,
      language: 'html'
    });
    vscode.window.showTextDocument(doc, vscode.ViewColumn.Active);
  });
}
