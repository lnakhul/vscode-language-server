// Add tooltip functionality for hyperlinks
                                document.getElementById('hostedContent').addEventListener('load', () => {
                                    const iframeDocument = document.getElementById('hostedContent').contentDocument;
                                    iframeDocument.querySelectorAll('a').forEach(link => {
                                        link.addEventListener('mouseover', () => {
                                            link.title = link.href;
                                        });
                                    });
                                });
