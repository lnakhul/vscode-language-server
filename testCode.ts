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
