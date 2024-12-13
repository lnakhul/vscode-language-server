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
