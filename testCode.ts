window.addEventListener('keydown', (event) => {
                                if (event.ctrlKey && event.shiftKey && event.key === 'P') {
                                    event.preventDefault();
                                    vsCodeApi.postMessage({ command: 'openCommandPalette' });
                                }
                            });




else if (isRegisteredCommand(message)) {
            const { args, vscodeCommand, messageId } = message;
            const res = await vscode.commands.executeCommand(vscodeCommand, ...(args ?? []));
            webview.postMessage({ messageId: messageId, res }).then(undefined, unexpectedException);
