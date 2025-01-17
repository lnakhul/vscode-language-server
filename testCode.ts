// Add tooltip functionality for hyperlinks
                                document.getElementById('hostedContent').addEventListener('load', () => {
                                    const iframeDocument = document.getElementById('hostedContent').contentDocument;
                                    iframeDocument.querySelectorAll('a').forEach(link => {
                                        link.addEventListener('mouseover', () => {
                                            link.title = link.href;
                                        });
                                    });
                                });


-----------------------------------------------------

// localHttpServer.ts (snippet)
import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';
import * as Stream from 'stream';

// ...

export class HttpServer {
  // ...

  async loadHtmlContent(localPath: string): Promise<ContentRespInfo> {
    const ext = path.extname(localPath);
    const contentType = this.getContentType(ext);
    
    // 1) Read the raw file bytes from disk:
    const fileContents = await vscode.workspace.fs.readFile(vscode.Uri.file(localPath));
    
    // 2) Convert to string:
    let content = new TextDecoder('utf-8').decode(fileContents);

    // 3) If it’s HTML, inject a title attribute on <a> tags that do not have one
    if (ext === '.html') {
      // This regex tries to locate <a ... href="something" ...>
      // and inserts title="something" if no title is already present.
      // Very simplistic approach that works well enough for typical Sphinx output.
      content = content.replace(
        /<a\b([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*)>/gi,
        (fullMatch, beforeHref, theHref, afterHref) => {
          // If the match already has a title=, skip:
          if (/\btitle\s*=/i.test(fullMatch)) {
            return fullMatch;
          }
          // Else inject title="theHref"
          return `<a ${beforeHref}href="${theHref}" title="${theHref}"${afterHref}>`;
        }
      );
    }

    // 4) Stream it back as usual:
    const stream = Stream.Readable.from(content);
    return { contentType, stream };
  }

  // ...
}


=================================================================

// localHttpServer.ts (relevant excerpt)
async loadHtmlContent(localPath: string): Promise<ContentRespInfo> {
  const ext = path.extname(localPath);
  const contentType = this.getContentType(ext);

  // 1. Read file and decode to string
  const fileContents = await vscode.workspace.fs.readFile(vscode.Uri.file(localPath));
  let content = new TextDecoder('utf-8').decode(fileContents);

  // 2. If this is an HTML file, inject the snippet
  if (ext === '.html') {
    // Inject a script before the closing </body> tag
    content = content.replace(
      /<\/body>/i,
      `<script>
         (function() {
           window.addEventListener('DOMContentLoaded', function() {
             var anchors = document.querySelectorAll('a[href]');
             anchors.forEach(function(a) {
               // If there's no existing title, set it to the href
               if (!a.hasAttribute('title')) {
                 a.setAttribute('title', a.href);
               }
             });
           });
         })();
       </script>
       </body>`
    );
  }

  // 3. Stream the final content back
  const stream = Stream.Readable.from(content);
  return { contentType, stream };
}


======================================

content = content.replace(
    /<\/body>/i,
    `<script>
       (function() {
         document.addEventListener('DOMContentLoaded', function() {
           const vsCodeApi = window.acquireVsCodeApi ? window.acquireVsCodeApi() : undefined;
           
           // Select all <a> that begin with "http://" or "https://"
           // i.e. fully external URLs.
           // Feel free to refine this if you want to exclude certain domains.
           document.querySelectorAll('a[href^="http"]').forEach(function(a) {
             a.addEventListener('click', function(evt) {
               // Prevent navigation in the iframe
               evt.preventDefault();
               if (vsCodeApi) {
                 // Post message to the extension, requesting it open the link externally
                 vsCodeApi.postMessage({
                   command: 'openExternal',
                   url: a.href
                 });
               } else {
                 // Fallback: if no vsCodeApi, try normal popup
                 window.open(a.href, '_blank');
               }
             });
           });
         });
       })();
     </script>
     </body>`
  );



================================

content = content.replace(
    /<\/body>/i,
    `<script>
      document.addEventListener('DOMContentLoaded', function() {
        // Acquire the VS Code API for messaging
        const vsCodeApi = window.acquireVsCodeApi?.();
        // Intercept any link that begins with "http" or "https"
        document.querySelectorAll('a[href^="http"]').forEach(a => {
          a.addEventListener('click', evt => {
            evt.preventDefault();
            if (vsCodeApi) {
              vsCodeApi.postMessage({
                type: 'command',
                command: 'openExternal',
                args: [ a.href ]  // pass the link to the extension
              });
            } else {
              // Fallback if vsCodeApi not found
              window.open(a.href, '_blank');
            }
          });
        });
      });
    </script>
    </body>`
  );


<script>
  document.addEventListener('DOMContentLoaded', function() {
    const vsCodeApi = acquireVsCodeApi();
    // For each anchor that starts with http...
    document.querySelectorAll('a[href^="http"]').forEach(a => {
      a.addEventListener('click', function(evt) {
        evt.preventDefault();
        // Only do the postMessage approach
        vsCodeApi.postMessage({
          type: 'command',
          command: 'openExternal',
          args: [ a.href ]
        });
      });
    });
  });
</script>

========================

// 1) Remove any "target=..." from external links
content = content.replace(
  /<a\b([^>]*?)href\s*=\s*["'](https?:\/\/[^"']+)["']([^>]*)>/gi,
  (fullMatch, beforePart, theHref, afterPart) => {
    // Remove any target="_blank" or target="someVal"
    const removedTarget = fullMatch.replace(/\s*target=["'][^"']*["']/gi, '');
    return removedTarget;
  }
);

