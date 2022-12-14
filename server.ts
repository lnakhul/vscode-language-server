//Provide the autocompletion items from grammar keywords in proc.tmLanguage.json
const AutoCompletionProvider = new class implements vscode.CompletionItemProvider {
	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.CompletionItem[] {
		const line = document.lineAt(position.line);
		const lineText = line.text.substring(0, position.character);
		const match = lineText.match(/(?<=\$)\w*$/);
		if (match) {
			const word = match[0];
			const completionItems = this.getCompletionItems(word);
			return completionItems;
		}
		return [];
	}

	private getCompletionItems(word: string): vscode.CompletionItem[] {
		const completionItems: vscode.CompletionItem[] = [];
		const keywords = this.getKeywords();
		for (const keyword of keywords) {
			if (keyword.startsWith(word)) {
				const completionItem = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
				completionItems.push(completionItem);
			}
		}
		return completionItems;
	}

	private getKeywords(): string[] {
		const keywords: string[] = [];
		const grammar = require('../../proc.tmLanguage.json');
		const repository = grammar.repository;
		for (const key in repository) {
			const value = repository[key];
			if (value.patterns) {
				for (const pattern of value.patterns) {
					if (pattern.match) {
						const match = pattern.match;
						if (match.startsWith('(?i)')) {
							const keyword = match.substring(4);
							keywords.push(keyword);
						}
					}
				}
			}
		}
		return keywords;
	}
};
