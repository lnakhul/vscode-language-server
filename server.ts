import * as vscode from 'vscode';
import { PHoverProvider } from './hoverProvider';
import { PErrorCheckingProvider } from './errorcheckProvider';
import { PKeywordCompletionProvider } from './autocompletionProvider';

// Create an instance of the PErrorCheckingProvider
const errorCheckingProvider = new PErrorCheckingProvider();

// Create an instance of the PHoverProvider
const hoverProvider = new PHoverProvider();

// Create an instance of the PKeywordCompletionProvider
const completionProvider = new PKeywordCompletionProvider();

// Register the PErrorCheckingProvider as a diagnostic provider for the 'p' language
vscode.languages.registerDiagnosticCollection('p', errorCheckingProvider);

// Register the PHoverProvider as a hover provider for the 'p' language
vscode.languages.registerHoverProvider('p', hoverProvider);

// Register the PKeywordCompletionProvider as a completion provider for the 'p' language, using the '.' character as a trigger
vscode.languages.registerCompletionItemProvider('p', completionProvider, ['.']);
