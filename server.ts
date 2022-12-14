import * as vscode from 'vscode';
import { PHoverProvider } from './hoverProvider';
import { PErrorCheckingProvider } from './errorcheckProvider';
import { AutocompletionProvider } from './autocompletionProvider';
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

// Implement the server side of the language server
export class PServer {

	// The connection to the client
	private connection = createConnection(ProposedFeatures.all);

	// The documents managed by the server
	private documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

	// The settings for the server
	private settings: any = {};

	// The diagnostics for the server
	private diagnostics: Diagnostic[] = [];

	// The hover provider for the server
	private hoverProvider: PHoverProvider = new PHoverProvider();

	// The error checking provider for the server
	private errorCheckingProvider: PErrorCheckingProvider = new PErrorCheckingProvider();

	// The keyword completion provider for the server
	private autoCompletionProvider: AutocompletionProvider = new AutocompletionProvider();

	// Initialize the server
	constructor() {
		// Initialize the connection
		this.connection.onInitialize((params: InitializeParams) => {
			return this.onInitialize(params);
		});

		// Listen for changes to the settings
		this.connection.onDidChangeConfiguration((change) => {
			this.onDidChangeConfiguration(change);
		});

		// Listen for changes to the documents
		this.documents.onDidChangeContent((change) => {
			this.onDidChangeContent(change);
		});

		// Listen for hover requests
		this.connection.onHover((textDocumentPosition: TextDocumentPositionParams) => {
			return this.onHover(textDocumentPosition);
		});

		// Listen for completion requests
		this.connection.onCompletion((textDocumentPosition: TextDocumentPositionParams) => {
			return this.onCompletion(textDocumentPosition);
		});

		// Listen for completion resolve requests
		this.connection.onCompletionResolve((completionItem: CompletionItem) => {
			return this.onCompletionResolve(completionItem);
		});
	}

	// Start the server
	public start() {
		this.documents.listen(this.connection);
		this.connection.listen();
	}

	// Handle the initialize request
	private onInitialize(params: InitializeParams): InitializeResult {
		return {
			capabilities: {
				textDocumentSync: TextDocumentSyncKind.Incremental,
				hoverProvider: true,
				completionProvider: {
					resolveProvider: true
				}
			}
		};
	}

	// Handle the change configuration request
	private onDidChangeConfiguration(change: any) {
		this.settings = change.settings;
		this.connection.console.log('Settings changed');
	}

	// Handle the change content request
	private onDidChangeContent(change: any) {
		this.validate(change.document);
	}

	// Handle the hover request
	private onHover(textDocumentPosition: TextDocumentPositionParams) {
		return this.hoverProvider.provideHover(this.documents.get(textDocumentPosition.textDocument.uri), textDocumentPosition.position);
	}

	// Handle the completion request
	private onCompletion(textDocumentPosition: TextDocumentPositionParams) {
		return this.autoCompletionProvider.provideCompletionItems(this.documents.get(textDocumentPosition.textDocument.uri), textDocumentPosition.position);
	}

	// Handle the completion resolve request
	private onCompletionResolve(completionItem: CompletionItem) {
		return this.autoCompletionProvider.resolveCompletionItem(completionItem);
	}

	// Validate the document
	private validate(document: TextDocument) {
		// Get the diagnostics
		this.diagnostics = this.errorCheckingProvider.provideDiagnostics(document);

		// Send the diagnostics to the client
		this.connection.sendDiagnostics({ uri: document.uri, diagnostics: this.diagnostics });
	}
}

// Create the server
const server = new PServer();

// Start the server
server.start();








