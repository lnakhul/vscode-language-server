import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

export class MyLanguageServerProvider {
  private client: LanguageClient;

  constructor(private readonly context: ExtensionContext) {
    const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    const serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
    };
    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: 'file', language: 'myLanguage' }],
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
      },
    };
    this.client = new LanguageClient(
      'myLanguageServer',
      'My Language Server',
      serverOptions,
      clientOptions
    );
  }

  public start() {
    this.context.subscriptions.push(this.client.start());
  }

  public dispose() {
    this.client.stop();
  }
}
