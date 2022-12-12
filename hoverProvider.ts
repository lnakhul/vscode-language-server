import * as vscode from 'vscode';

// Check if a word is a keyword
async function isKeyword(word: string): Promise<boolean> {
  // Load the p.tmLanguage.json file
  const grammar = vscode.Uri.file('./p.tmLanguage.json');
  const content = await vscode.workspace.fs.readFile(grammar);

  // Parse the JSON file using the json5 library
  const json = json5.parse(content.toString());

  // Get the keywords from the JSON object
  const keywords = json.repository.keyword.patterns[0].match;

  // Check if the word is in the list of keywords
  return keywords.includes(word);
}

// Check if a word is an identifier
async function isIdentifier(word: string): Promise<boolean> {
  // Load the p.tmLanguage.json file
  const grammar = vscode.Uri.file('./p.tmLanguage.json');
  const content = await vscode.workspace.fs.readFile(grammar);

  // Parse the JSON file using the json5 library
  const json = json5.parse(content.toString());

  // Get the identifier pattern from the JSON object
  const pattern = json.repository.identifier.patterns[0].match;

  // Use the pattern to check if the word is an identifier
  const regex = new RegExp(pattern);
  return regex.test(word);
}


// Implement the provideHover method of the HoverProvider interface
export class PHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    // Get the word at the hover position
    const wordRange = document.getWordRangeAtPosition(position);
    const word = document.getText(wordRange);

    // Check if the word is a keyword or other language element
    if (isKeyword(word)) {
      // Return a Hover object with information about the keyword
      return new vscode.Hover(`This is a keyword: ${word}`);
    } else if (isIdentifier(word)) {
      // Return a Hover object with information about the identifier
      return new vscode.Hover(`This is an identifier: ${word}`);
	}

	// Return undefined if the word is not a keyword or identifier
	return undefined;
	  // eslint-disable-next-line no-mixed-spaces-and-tabs
	  }
}



