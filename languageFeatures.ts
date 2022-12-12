
import * as vscode from 'vscode';
import { PKeywordCompletionProvider } from './autocompletionProvider';
import { PErrorCheckingProvider } from './errorcheckProvider';
import { PHoverProvider } from './hoverProvider';

export function registerLanguageFeatures(context: vscode.ExtensionContext) {
  // Register the PKeywordCompletionProvider for the 'p' language
  vscode.languages.registerCompletionItemProvider('p', new PKeywordCompletionProvider(), ['.']);

  // Register the PErrorCheckingProvider as a diagnostic provider for the 'p' language
  vscode.languages.registerDiagnosticCollection('p', new PErrorCheckingProvider());

  // Register the PHoverProvider as a hover provider for the 'p' language
  vscode.languages.registerHoverProvider('p', new PHoverProvider());

}
