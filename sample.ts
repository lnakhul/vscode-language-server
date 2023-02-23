import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';

class MyLanguageServer {
  private client: LanguageClient;

  async start(context: ExtensionContext): Promise<{ dispose(): void }> {
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));

    // The debug options for the server
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    // If the extension is launched in debug mode then the debug server options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for documents
        documentSelector: [{ scheme: 'file', language: 'myLanguage' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        }
    };

    // Create the language client
    this.client = new LanguageClient(
        'myLanguageServer',
        'My Language Server',
        serverOptions,
        clientOptions
    );

    // Start the language client
    await this.client.start();

    // Return the disposable object with a dispose method
    return {
      dispose: () => this.client.stop(),
    };
  }
}

export async function activate(context: ExtensionContext) {
  const myLanguageServer = new MyLanguageServer();
  const disposable = await myLanguageServer.start(context);
  context.subscriptions.push(disposable);
}
