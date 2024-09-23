abstract createTreeItem(): vscode.TreeItem {
    const item = new vscode.TreeItem(this.getLabel(), this.getCollapsibleState());
    item.contextValue = this.getContextValue();
    item.tooltip = this.getTooltip();
    item.iconPath = this.getIconPath();
    item.command = this.getCommand();
    return item;
}

abstract getLabel(): string;
abstract getCollapsibleState(): vscode.TreeItemCollapsibleState;
abstract getContextValue(): string;
abstract getTooltip(): string;
abstract getIconPath(): vscode.ThemeIcon;
abstract getCommand(): vscode.Command | undefined;


==========================================

getLabel(): string {
    return this.bookmark.content ?? `Line: ${this.bookmark.line}`;
}

getCollapsibleState(): vscode.TreeItemCollapsibleState {
    return vscode.TreeItemCollapsibleState.None;
}

getContextValue(): string {
    return `${BOOKMARK_NODE_CONTEXT_VALUE}${BookmarkLineElement.uriPath}`;
}

getTooltip(): string {
    return `${this.bookmark.content} (Line: ${this.bookmark.line})`;
}

getIconPath(): vscode.ThemeIcon {
    return new vscode.ThemeIcon('bookmark');
}

getCommand(): vscode.Command | undefined {
    return {
        command: 'quartz.openBookmark',
        title: 'Open Bookmark',
        arguments: [this.bookmark]
    };
}

===================================================

private sortBookmarks(bookmarks: Bookmark[]): Bookmark[] {
    return bookmarks.sort((a, b) => {
        if (a.path === b.path) {
            return a.line - b.line;
        }
        return a.path.localeCompare(b.path);
    });
}

private getSortedBookmarks(): Bookmark[] {
    return this.sortBookmarks(this.bookmarks);
}


=========================================

private async addOrUpdateBookmark(bookmark: Bookmark): Promise<void> {
    if (this.hasBookmark(bookmark.path, bookmark.line)) {
        const fileName = pathModule.basename(bookmark.path);
        vscode.window.showInformationMessage(`Bookmark already exists for line ${bookmark.line} in ${fileName}.`);
        return;
    }
    this.bookmarks.push(bookmark);
    await this.saveBookmarks();
    this.refresh();
}

async addBookmark(arg?: {lineNumber: number, uri: vscode.Uri}): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) return;

    const lineNumber = arg ? arg.lineNumber : activeEditor.selection.active.line + 1;
    const uri = arg ? arg.uri : activeEditor.document.uri;
    const document = await vscode.workspace.openTextDocument(uri);
    const text = document.lineAt(lineNumber - 1).text;
    const filePath = this.uriToSandraPath(uri);
    if (!filePath) return;

    const bookmark: Bookmark = { type: 'line', path: filePath, line: lineNumber, content: text.trim() };
    await this.addOrUpdateBookmark(bookmark);
    this.updateDecorations(await vscode.window.showTextDocument(document));
}

========================================

private registerDecorationListeners(): void {
    vscode.window.onDidChangeVisibleTextEditors(editors => editors.forEach(editor => this.updateDecorations(editor)));
    vscode.window.onDidChangeActiveTextEditor(editor => editor && this.updateDecorations(editor));
    vscode.workspace.onDidChangeTextDocument(e => this.handleDocumentChange(e));
    vscode.window.onDidChangeTextEditorVisibleRanges(e => this.updateDecorations(e.textEditor));
    vscode.workspace.onDidOpenTextDocument(doc => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document === doc) {
            this.updateDecorations(activeEditor);
        }
    });
}

==================================================


private async fetchBookmarkAreas(): Promise<BookmarkAreaElement[]> {
    const areasMap = this.createAreasMap();
    const fileMap = this.createFileMap();

    fileMap.forEach((fileElement, filePath) => {
        const dirPath = pathModule.dirname(filePath);
        const areaElement = areasMap.get(dirPath);
        if (areaElement) {
            areaElement.children.push(fileElement);
            fileElement.parent = areaElement;
        }
    });

    this.sortAreasAndFiles(areasMap);
    return Array.from(areasMap.values());
}

==================================================

private updateBookmarkContent(bookmark: Bookmark, newLine: number, document: vscode.TextDocument): Bookmark {
    return {
        ...bookmark,
        line: newLine,
        content: document.lineAt(newLine - 1).text.trim()
    };
}

async handleDocumentChange(e: vscode.TextDocumentChangeEvent): Promise<void> {
    let bookmarksToUpdate: BookmarkUpdate[] = [];
    e.contentChanges.forEach(change => {
        const lineDelta = change.text.split('\n').length - (change.range.end.line - change.range.start.line + 1);
        this.bookmarks.forEach(bookmark => {
            if (bookmark.path === this.uriToSandraPath(e.document.uri) && bookmark.line > change.range.start.line) {
                const newBookmark = this.updateBookmarkContent(bookmark, bookmark.line + lineDelta, e.document);
                bookmarksToUpdate.push({ oldBookmark: bookmark, newBookmark });
            }
        });
    });

    await Promise.all(bookmarksToUpdate.map(({ oldBookmark, newBookmark }) => this.updateBookmark(oldBookmark, newBookmark)));
    if (bookmarksToUpdate.length > 0) this.refreshDataTree();
}

========================================================
private createQuickPickItems(bookmarks: Bookmark[]): vscode.QuickPickItem[] {
    return bookmarks.map(({ path, line, content }) => ({
        label: `${pathModule.basename(path)}:${line}`,
        description: content || '',
        detail: path
    }));
}

    // Helper function to find the selected bookmark
private findBookmark(bookmarks: Bookmark[], selected: vscode.QuickPickItem): Bookmark | undefined {
    return bookmarks.find(({ path, line }) => `${pathModule.basename(path)}:${line}` === selected.label);
}

async listBookmarksFromAllFiles(): Promise<void> {
  const bookmarks = this.getSortedBookmarks();
  
  if (!bookmarks.length) {
    vscode.window.showInformationMessage('No bookmarks available.');
    return;
  }

  const items = this.createQuickPickItems(bookmarks);  // Create quick pick items

  const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a bookmark to open',
      matchOnDescription: true,
      matchOnDetail: true
  });

  // Open the selected bookmark, if any
  if (selected) {
    const bookmark = this.findBookmark(bookmarks, selected);
    if (bookmark) {
      await this.openBookmark(bookmark);
    }
  }
}
