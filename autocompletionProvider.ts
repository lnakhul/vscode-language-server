import * as vscode from 'vscode';
import * as json5 from 'json5';

// Load the p.tmLanguage.json file
const grammar = vscode.Uri.file('.syntaxes/p.tmLanguage.json');
const content = await vscode.workspace.fs.readFile(grammar);

// Parse the JSON file using the json5 library
const json = json5.parse(content.toString());

// Get the keywords from the JSON object
const keywords = json.repository.keyword.patterns[0].match;

// Implement the provideCompletionItems method of the CompletionItemProvider interface
export class PKeywordCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    // Create a CompletionItem for each keyword
    const completionItems = keywords.map(keyword => {
      const completionItem = new vscode.CompletionItem(keyword);
      completionItem.kind = vscode.CompletionItemKind.Keyword;
      return completionItem;
    });

    // Return the list of CompletionItems
    return completionItems;
  }
}


