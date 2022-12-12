import * as vscode from 'vscode';
import { TextmateRegistry } from 'vscode-textmate';

// Load the p.tmLanguage.json file
const grammar = vscode.Uri.file('./p.tmLanguage.json');
const content = await vscode.workspace.fs.readFile(grammar);

// Create a TextmateRegistry and register the grammar
const registry = new TextmateRegistry();
registry.loadGrammar(grammar, content.toString());

// Create a TextmateTheme and register it with the VS Code editor
const theme = new vscode.TextmateTheme('p-theme', {
  colors: {},
  tokenColors: []
});
vscode.window.registerColorTheme('p-theme', theme);

// Use the TextmateRegistry to style text in the editor
const style = registry.getGrammar(grammar).then(grammar => {
  vscode.languages.setLanguageConfiguration('p', {
    tokenizer: {
      root: grammar.tokenizeLine2('').tokens,
    },
    comments: grammar.comments,
    brackets: grammar.brackets,
  });
});
