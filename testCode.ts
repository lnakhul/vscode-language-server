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
