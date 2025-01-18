import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ProxyManager, ProxyProcessState } from './proxyManager';
import { SourceLocator } from './sourceCache';
import { ReactWebviewService } from './reactViews';
import { Trash } from './utils';
import { logger } from './logger';

export interface SphinxResponse {
    status: string;
    content: string;
}

const Levels: vscode.SymbolKind[] = [
    vscode.SymbolKind.Module,
    vscode.SymbolKind.Package,
    vscode.SymbolKind.Class,
    vscode.SymbolKind.Method,
    vscode.SymbolKind.Variable
];

export interface DocOutline {
    titleText: string;
    lineno: number;
    endLineno?: number;
    children: DocOutline[];
    level: number;
}

export function findSymbolKind(level: number): vscode.SymbolKind {
    return Levels[Math.min(level, Levels.length - 1)];
}

function convertChildToSymbolInformation(child: DocOutline): vscode.DocumentSymbol {
    const { titleText, children, endLineno, lineno, level } = child;
    const range = new vscode.Range(new vscode.Position(lineno, 0), new vscode.Position(endLineno ?? lineno + 1, 0));
    const selectionRange = new vscode.Range(new vscode.Position(lineno, 0), new vscode.Position(lineno + 1, 0));
    const symbol = new vscode.DocumentSymbol(titleText, '', findSymbolKind(level), range, selectionRange);
    symbol.children = children.map(convertChildToSymbolInformation);
    return symbol;
}

export function converDocOutlineToSymbols(outline: DocOutline, wholeTextRange: vscode.Range): vscode.DocumentSymbol[] {
    const rootSymbol = new vscode.DocumentSymbol(outline.titleText, '', findSymbolKind(outline.level), wholeTextRange, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1, 0)));
    rootSymbol.children = outline.children.map(convertChildToSymbolInformation);
    return [rootSymbol];
}

export class SphinxProvider implements vscode.Disposable, vscode.DocumentSymbolProvider {
    private trash: Trash;
    private docGeneratedHtmlIcon: vscode.Uri;
    private output?: vscode.LogOutputChannel;

    constructor(private sourceLocator: SourceLocator, private proxyManager: ProxyManager, private reactView: ReactWebviewService) {
        this.trash = new Trash(...this.register());
        this.docGeneratedHtmlIcon = this.reactView.getResourceIconPath('quartzDocIcon.svg');
    }

    get outputChannel(): vscode.LogOutputChannel {
        if (!this.output) {
            this.output = vscode.window.createOutputChannel('Sphinx Renderer', { log: true });
            this.trash.add(this.output);
        }

        return this.output;
    }

    private async showInWebView(localHtmlPath: string, sandraPath: string): Promise<void> {
        await this.reactView.openLocalSphinx(localHtmlPath, { title: `Doc Gen ${sandraPath}`, identifier: `localhtmlSphinx-${sandraPath}`, iconPath: this.docGeneratedHtmlIcon });
    }

    private async openInSystemBrowser(localHtmlPath: string): Promise<void> {
        const open = require('open');
        await open(localHtmlPath);
    }

    *register(): Generator<vscode.Disposable> {
        yield vscode.commands.registerCommand('quartz.generateSphinxDocs', this.generateSphinxDoc, this);
        yield vscode.commands.registerCommand('quartz.viewSphinxDocsInBrowser', this.viewSphinxDocsInBrowser, this);
        yield vscode.languages.registerDocumentSymbolProvider({ language: 'restructuredtext' }, this, { label: 'Quartz rst outline provider' });
    }

    public async generateSphinxDoc(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const { document } = editor;
        const { uri } = document;
        const sandraPath = this.sourceLocator.uriToSandraPath(uri);

        if (!sandraPath || document.languageId !== 'restructuredtext') {
            vscode.window.showErrorMessage('The active editor is not an RST file.');
            return;
        }

        const baseSandraPath = path.dirname(sandraPath);
        const response = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, cancellable: false }, async (progress, token) => {
            const message = `Generating sphinx documentation for ${baseSandraPath}...`;
            progress.report({ message });

            const output = this.outputChannel;

            await vscode.commands.executeCommand('workbench.panel.output.focus');

            output.info(message);
            output.show(true);

            const d = this.proxyManager.onNotification('sphinxLog', (level: number, logMessage: string) => {
                switch (level) {
                    case 10:
                        output.debug(logMessage);
                        break;
                    case 20:
                        output.info(logMessage);
                        break;
                    case 30:
                        output.warn(logMessage);
                        break;
                    case 40:
                    case 50:
                        output.error(logMessage);
                        break;
                    default:
                        output.error(logMessage);
                        break;
                }
            });

            try {
                return await this.proxyManager.sendRequest<SphinxResponse>(token, 'sphinx:generate', uri.fsPath);
            } finally {
                d.dispose();
            }
        });

        if (!response.status) {
            vscode.window.showErrorMessage(`Failed to generate Sphinx documentation ${baseSandraPath}`);
            return;
        }

        await this.showInWebView(response.content, sandraPath);
    }

    public async viewSphinxDocsInBrowser(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const { document } = editor;
        const { uri } = document;
        const sandraPath = this.sourceLocator.uriToSandraPath(uri);

        if (!sandraPath || document.languageId !== 'restructuredtext') {
            vscode.window.showErrorMessage('The active editor is not an RST file.');
            return;
        }

        const baseSandraPath = path.dirname(sandraPath);
        const response = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, cancellable: false }, async (progress, token) => {
            const message = `Generating sphinx documentation for ${baseSandraPath}...`;
            progress.report({ message });

            const output = this.outputChannel;

            await vscode.commands.executeCommand('workbench.panel.output.focus');

            output.info(message);
            output.show(true);

            const d = this.proxyManager.onNotification('sphinxLog', (level: number, logMessage: string) => {
                switch (level) {
                    case 10:
                        output.debug(logMessage);
                        break;
                    case 20:
                        output.info(logMessage);
                        break;
                    case 30:
                        output.warn(logMessage);
                        break;
                    case 40:
                    case 50:
                        output.error(logMessage);
                        break;
                    default:
                        output.error(logMessage);
                        break;
                }
            });

            try {
                return await this.proxyManager.sendRequest<SphinxResponse>(token, 'sphinx:generate', uri.fsPath);
            } finally {
                d.dispose();
            }
        });

        if (!response.status) {
            vscode.window.showErrorMessage(`Failed to generate Sphinx documentation ${baseSandraPath}`);
            return;
        }

        await this.openInSystemBrowser(response.content);
    }

    async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[] | undefined> {
        const sandraPath = this.sourceLocator.uriToSandraPath(document.uri);
        if (!sandraPath) return undefined;
        return await vscode.window.withProgress<vscode.DocumentSymbol[] | undefined>({ location: { viewId: 'outline' } }, async () => {
            const text = document.getText();

            if (this.proxyManager.state !== ProxyProcessState.Connected) {
                await this.proxyManager.connected(token);
            }

            const outline = await this.proxyManager.sendRequest<DocOutline>(token, 'sphinx:createOutline', sandraPath, text);
            if (!outline) {
                logger.error(`No outline created for ${document.uri.path}`);
                return undefined;
            }

            const everything = new vscode.Range(
                new vscode.Position(0, 0),
                document.validatePosition(new vscode.Position(document.lineCount + 1, 0))
            );
            logger.debug(`Building outline for ${sandraPath}`);
            return converDocOutlineToSymbols(outline, everything);
        });
    }

    dispose() {
        this.trash.dispose();
    }
}
