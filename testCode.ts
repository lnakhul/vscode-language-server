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
