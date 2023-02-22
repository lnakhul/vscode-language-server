import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import * as vscode from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export class LanguageClientProvider {
	private client: LanguageClient;
	private context: ExtensionContext;
	private serverModule: string;
	private serverOptions: ServerOptions;
	private clientOptions: LanguageClientOptions;

	constructor(context: ExtensionContext) {
		this.context = context;
		this.serverModule = this.context.asAbsolutePath(
			path.join('server', 'out', 'server.js')
		);
		this.serverOptions = {
			run: { module: this.serverModule, transport: TransportKind.ipc },
			debug: {
				module: this.serverModule,
				transport: TransportKind.ipc,
				options: { execArgv: ['--nolazy', '--inspect=6009'] }
			}
		};
		this.clientOptions = {
			documentSelector: [{ scheme: 'file', language: 'bobproc' }],
			synchronize: {
				fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
			}
		};
	}

	public start() {
		this.client = new LanguageClient(
			'languageServerExample',
			'Language Server Example',
			this.serverOptions,
			this.clientOptions
		);
		this.client.start();
	}

	public stop() {
		if (!this.client) {
			return undefined;
		}
		return this.client.stop();
	}
}