<script async nonce="${nonce}">
                            (function () {
                                const vsCodeApi = acquireVsCodeApi();
                                window.addEventListener('load', (event) => {
                                    console.log('Webview content loaded'); // This is printed
                                    vsCodeApi.postMessage({ command: 'done' });

                                    const iframe = document.getElementById('hostedContent');
                                    iframe.addEventListener('load', () => {
                                        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
                                        iframeDocument.addEventListener('mouseover', (event) => {
                                            if (event.target.tagName === 'A') {
                                                console.log('Hovering over link:', event.target.href); // Add this line
                                                vsCodeApi.postMessage({ command: 'hoverLink', url: event.target.href });
                                            }
                                        });
                                        iframeDocument.addEventListener('mouseout', (event) => {
                                            if (event.target.tagName === 'A') {
                                                console.log('Stopped hovering over link'); // Add this line
                                                vsCodeApi.postMessage({ command: 'hoverLink', url: '' });
                                            }
                                        });
                                    });
                                });
                                window.addEventListener('message', (event) => {
                                    document.getElementById('hostedContent').contentWindow.postMessage(event.data, '*');
                                });
                            }());
                        </script>




<script>
    (function() {
        const vsCodeApi = acquireVsCodeApi();   // Provided by VS Code Webview
        const iframe = document.getElementById('hostedContent');

        // This parent 'load' event ensures our script runs after
        // the webview body loads, but not necessarily the iframe content.
        window.addEventListener('load', () => {
            if (!iframe) return;

            // Wait for the iframe itself to load (i.e. the Sphinx doc).
            iframe.addEventListener('load', () => {
                // Access the iframe's document and attach mouse events
                const iframeDoc = iframe.contentWindow?.document;
                if (!iframeDoc) {
                    console.log("iframe.contentWindow.document is null (possibly cross-origin?)");
                    return;
                }

                iframeDoc.addEventListener('mouseover', (e) => {
                    const a = e.target.closest('a');
                    if (a && a.href) {
                        console.log('Hovering link in iframe:', a.href);
                        vsCodeApi.postMessage({ command: 'hoverLink', url: a.href });
                    }
                });

                iframeDoc.addEventListener('mouseout', (e) => {
                    if (e.target.tagName === 'A') {
                        vsCodeApi.postMessage({ command: 'hoverLink', url: '' });
                    }
                });
            });
        });
    })();
    </script>


====================================

const iframe = document.getElementById('hostedContent');
                            iframe.addEventListener('load', () => {
                                try {
                                    const doc = iframe.contentDocument;
                                    if (doc) {
                                        const links = doc.querySelectorAll('a[href]');
                                        for (const link of links) {
                                            const href = link.getAttribute('href');
                                            if (href && !link.hasAttribute('title')) {
                                                link.setAttribute('title', href);
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.error('Unable to set link tooltips', e);
                                }
                            });

                            window.addEventListener('load', (event) => {
                                vsCodeApi.postMessage({ command: 'done' });
                            });

============================================================

<script nonce="${nonce}">
                    document.addEventListener('DOMContentLoaded', () => {
                        const iframe = document.querySelector('iframe');
                        const tooltip = document.getElementById('tooltip');
                        if (iframe) {
                            iframe.contentWindow.addEventListener('mouseover', (event) => {
                                if (event.target.tagName === 'A') {
                                    const href = event.target.getAttribute('href');
                                    tooltip.textContent = href;
                                    tooltip.style.display = 'block';
                                    tooltip.style.left = event.pageX + 'px';
                                    tooltip.style.top = event.pageY + 'px';
                                }
                            });
                            iframe.contentWindow.addEventListener('mouseout', (event) => {
                                if (event.target.tagName === 'A') {
                                    tooltip.style.display = 'none';
                                }
                            });
                        }
                    });
                </script>


=====================================

def inject_tooltip_script(self):
        """Inject tooltip script and styles into the generated HTML files."""
        tooltip_script = """
        <script>
        document.addEventListener('DOMContentLoaded', () => {
            const tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = '#333';
            tooltip.style.color = '#fff';
            tooltip.style.padding = '5px';
            tooltip.style.borderRadius = '5px';
            tooltip.style.display = 'none';
            tooltip.style.zIndex = '1000';
            document.body.appendChild(tooltip);

            document.addEventListener('mouseover', (event) => {
                if (event.target.tagName === 'A') {
                    const href = event.target.getAttribute('href');
                    tooltip.textContent = href;
                    tooltip.style.display = 'block';
                    tooltip.style.left = event.pageX + 'px';
                    tooltip.style.top = event.pageY + 'px';
                }
            });

            document.addEventListener('mouseout', (event) => {
                if (event.target.tagName === 'A') {
                    tooltip.style.display = 'none';
                }
            });
        });
        </script>
        """
        tooltip_style = """
        <style>
        #tooltip {
            position: absolute;
            background-color: #333;
            color: #fff;
            padding: 5px;
            border-radius: 5px;
            display: none;
            z-index: 1000;
        }
        </style>
        """
        for root, _, files in os.walk(self.target):
            for file in files:
                if file.endswith('.html'):
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r+', encoding='utf-8') as f:
                        content = f.read()
                        if '</body>' in content:
                            content = content.replace('</body>', f'{tooltip_script}</body>')
                        if '</head>' in content:
                            content = content.replace('</head>', f'{tooltip_style}</head>')
                        f.seek(0)
                        f.write(content)
                        f.truncate()
=========================================

// ...existing code...

export class ReactWebviewService implements vscode.WebviewPanelSerializer {
    // ...existing code...

    async openLocalSphinx(localPath: string, options: {title: string, identifier: string, iconPath: ThemedUriIcon}): Promise<vscode.WebviewPanel|undefined> {
        const srcUri = this.httpServer.getSphinxHtml(localPath);
        if (!srcUri) {
            logMessageWithNotification({ message: `Unable to get Sphinx HTML URI for ${localPath}`, level: 'error' });
            return;
        }

        const htmlContent = await this.fetchSphinxHtmlContent(srcUri.toString(true));
        return await this.openLocalHtmlContent(htmlContent, options);
    }

    private async fetchSphinxHtmlContent(uri: string): Promise<string> {
        const response = await fetch(uri);
        if (!response.ok) {
            throw new Error(`Failed to fetch Sphinx HTML content from ${uri}`);
        }
        return await response.text();
    }

    private async openLocalHtmlContent(htmlContent: string, options: {title: string, identifier: string, iconPath?: ThemedUriIcon}): Promise<vscode.WebviewPanel|undefined> {
        const localResourceRoots = defaultLocalResourceRoots(this.context);
        const webviewOptions: vscode.WebviewPanelOptions & vscode.WebviewOptions = {
            enableScripts: true,
            enableCommandUris: false,
            localResourceRoots,
        };
        const { title, identifier, iconPath, onDispose } = options;

        try {
            return await vscode.window.withProgress<vscode.WebviewPanel>({
                title: `Loading ${title}...`,
                location: vscode.ProgressLocation.Notification
            }, async (progress, token) => {
                return await new Waiter({ token }).wait<vscode.WebviewPanel>((resolve, reject, register) => {
                    const panel = vscode.window.createWebviewPanel(`${identifier}`, title, 1, webviewOptions);
                    this.capturePanel(panel);
                    panel.iconPath = iconPath;
                    const webview = panel.webview;
                    register(webview.onDidReceiveMessage((message: { command: string, error?: string }) => {
                        switch (message.command) {
                            case 'done':
                                resolve(panel);
                                return;
                            case 'error':
                                reject(new Error(message.error ?? `Unable to load profile for ${identifier}`));
                                return;
                            default:
                                return;
                        }
                    }), panel.onDidDispose(() => {
                        onDispose?.();
                        reject();
                    }));
                    const nonce = makeNonce();
                    panel.webview.html = `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ${webview.cspSource}; font-src ${webview.cspSource} https://fonts.gstatic.com/; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} https://fonts.googleapis.com/ 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}';">
                        <style>
                            #tooltip {
                                position: absolute;
                                background-color: #333;
                                color: #fff;
                                padding: 5px;
                                border-radius: 5px;
                                display: none;
                                z-index: 1000;
                            }
                        </style>
                    </head>
                    <body>
                        ${htmlContent}
                        <div id="tooltip"></div>
                        <script nonce="${nonce}">
                            document.addEventListener('DOMContentLoaded', () => {
                                const tooltip = document.getElementById('tooltip');
                                document.addEventListener('mouseover', (event) => {
                                    if (event.target.tagName === 'A') {
                                        const href = event.target.getAttribute('href');
                                        tooltip.textContent = href;
                                        tooltip.style.display = 'block';
                                        tooltip.style.left = event.pageX + 'px';
                                        tooltip.style.top = event.pageY + 'px';
                                    }
                                });
                                document.addEventListener('mouseout', (event) => {
                                    if (event.target.tagName === 'A') {
                                        tooltip.style.display = 'none';
                                    }
                                });
                            });
                        </script>
                    </body>
                    </html>`;
                });
            });
        } catch (e) {
            logMessageWithNotification({ message: `Unable to load profile for ${identifier} due to ${(e as Error).message}`, level: 'error' });
        }
    }

    // ...existing code...
}
