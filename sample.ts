import { workspace, ExtensionContext, window, Disposable } from 'vscode';
import {
  BaseLanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
} from 'vscode-languageclient';
import { joinPath } from './paths';

export type LanguageClientConstructor = (
  name: string,
  description: string,
  clientOptions: LanguageClientOptions
) => BaseLanguageClient;

export class LanguageServerProvider {
  private client?: BaseLanguageClient;

  constructor(
    private readonly context: ExtensionContext,
    private readonly languageClientConstructor: LanguageClientConstructor,
  ) {}

  public start(): Disposable {
    const lsName = 'YAML Support';
    const outputChannel = window.createOutputChannel(lsName);
    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
      // Register the server for on disk and newly created YAML documents
      documentSelector: [{ language: 'yaml' }, { language: 'dockercompose' }, { pattern: '*.y(a)ml' }],
      synchronize: {
        // Notify the server about file changes to YAML and JSON files contained in the workspace
        fileEvents: [workspace.createFileSystemWatcher('**/*.?(e)y?(a)ml'), workspace.createFileSystemWatcher('**/*.json')],
      },
      revealOutputChannelOn: RevealOutputChannelOn.Never,
    };

    // Create the language client and start it
    this.client = this.languageClientConstructor('yaml', lsName, clientOptions);
    const disposable = this.client.start();
    this.context.subscriptions.push(disposable);

    return disposable;
  }

  public stop(): Thenable<void> | undefined {
    if (this.client) {
      return this.client.stop();
    }
  }
}
