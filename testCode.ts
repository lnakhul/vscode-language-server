import sandra
from typing import List, Dict

class BookmarkService:
    PREFIX = 'bookmark'
    
    def __init__(self, db):
        self.db = db
        self.bookmark_dir = f"/vscode/bookmarks/{sandra.USERNAME}"
    
    def _bookmark_path(self, bookmark):
        return f"{self.bookmark_dir}/{bookmark['type']}/{bookmark['path'].replace('/', ':')}"

    def add_bookmark(self, bookmark: Dict):
        """Adds a new bookmark."""
        bm_path = self._bookmark_path(bookmark)
        obj = sandra.read_or_new(self.db, bm_path, text=str(bookmark))
        obj.write()

    def get_bookmarks(self) -> List[Dict]:
        """Retrieves all bookmarks."""
        bookmarks = []
        for bm_path in sandra.walk(self.bookmark_dir, db=self.db, returnDirs=False):
            bm_obj = sandra.read(self.db, bm_path)
            bookmarks.append(eval(bm_obj.text))
        return bookmarks

    def update_bookmark(self, bookmark: Dict):
        """Updates an existing bookmark."""
        bm_path = self._bookmark_path(bookmark)
        obj = sandra.read_or_new(self.db, bm_path, text=str(bookmark))
        obj.text = str(bookmark)
        obj.write()

    def delete_bookmark(self, bookmark: Dict):
        """Deletes a bookmark."""
        bm_path = self._bookmark_path(bookmark)
        sandra.delete(self.db, bm_path)

# Usage example
db = sandra.connect(f"homedirs/home/{sandra.USERNAME}")
bookmark_service = BookmarkService(db)

def get_bookmarks(self):
        """Retrieves bookmark objects and their metadata."""
        bookmarks_path = self.user_bookmarks_path()
        bookmark_paths = list(sandra.walk(bookmarks_path, db=self.db, returnDirs=False))
        bookmarks = list(sandra.readObjects(bookmark_paths, db=self.db))

        # Process bookmarks to extract metadata and content
        processed_bookmarks = []
        for bookmark_obj in bookmarks:
            try:
                # Assuming bookmarks are stored as text in a property named 'text'
                bookmark_content = ast.literal_eval(bookmark_obj.text) if hasattr(bookmark_obj, 'text') else {}
            except (ValueError, SyntaxError):
                # Handle the case where the text property is not a properly formatted string
                bookmark_content = {}

            bookmark_data = {
                'path': bookmark_obj.path(),
                'content': bookmark_content,
                # Add additional processing as needed
            }
            processed_bookmarks.append(bookmark_data)

        return processed_bookmarks


private async fetchBookmarkAreas(): Promise<BookmarkAreaElement[]> {
    const areasMap = new Map<string, BookmarkAreaElement>();
    const fileMap = new Map<string, BookmarkFileElement>();
  
    this.bookmarks.forEach(bookmark => {
      let fileElement = fileMap.get(bookmark.path);
      if (!fileElement) {
        fileElement = new BookmarkFileElement(bookmark, this.fileIcon);
        fileMap.set(bookmark.path, fileElement);
      }
      const lineElement = new BookmarkLineElement(bookmark);
      fileElement.children.push(lineElement);
      fileElement.children.sort((a, b) => a.bookmark.line - b.bookmark.line);
    });
  
    fileMap.forEach((fileElement, path) => {
      const dirPath = pathModule.dirname(path);
      let area = areasMap.get(dirPath);
      if (!area) {
        area = new BookmarkAreaElement({type: 'folder', path: dirPath, line: 0}, undefined);
        area.id = dirPath;
        areasMap.set(dirPath, area);
      }
      area.children.push(fileElement);
      area.children.sort((a, b) => a.bookmark.path.localeCompare(b.bookmark.path));
    });
    
    // Sort the areas by path
    const areasArray = Array.from(areasMap.values());
    areasArray.sort((a, b) => a.bookmarkItem.path.localeCompare(b.bookmarkItem.path));
  
    // Sort the file elements within each area
    areasArray.forEach(area => {
      area.children.sort((a, b) => a.bookmark.path.localeCompare(b.bookmark.path));
    });
  
    return areasArray;
  }


  async openBookmark(bookmark?: Bookmark): Promise<void> {
    let path: string|undefined = undefined;
    let line: number|undefined = undefined;

    if (bookmark) {
        path = bookmark.path;
        line = bookmark.line;
    } else {
        // If no bookmark is provided, you could implement a function to select a bookmark
        // For example:
        // bookmark = await selectBookmark();
        // path = bookmark.path;
        // line = bookmark.line;
    }

    if (!path) return;

    const uri = vscode.Uri.file(path);
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, { preview: true });

    if (line) {
        editor.revealRange(new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line + 1, 0)));
    }
}



async openBookmark(bookmark: Bookmark): Promise<void> {
  const uri = vscode.Uri.file(bookmark.path);
  vscode.workspace.openTextDocument(uri).then(doc => {
    if (bookmark.line >= doc.lineCount || doc.lineAt(bookmark.line).text.trim() !== bookmark.content) {
      // The bookmark is invalid, notify the user
      vscode.window.showInformationMessage('The bookmark is no longer valid.');
      // Delete the bookmark or skip to the next/previous one
      this.removeBookmark(bookmark);
    } else {
      // The bookmark is valid, navigate to it
      vscode.window.showTextDocument(doc).then(editor => {
        editor.selection = new vscode.Selection(bookmark.line, 0, bookmark.line, 0);
        editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
      });
    }
  });
}


  private handleDocumentChange(e: vscode.TextDocumentChangeEvent): void {
    for (const change of e.contentChanges) {
      const startLine = change.range.start.line;
      const endLine = change.range.end.line;
      const lineDelta = change.text.split('\n').length - (endLine - startLine + 1);

      if (lineDelta !== 0) {
        for (const bookmark of this.bookmarks) {
          if (bookmark.path === e.document.uri.fsPath) {
            if (bookmark.line > startLine) {
              bookmark.line += lineDelta;
            } else if (bookmark.line >= startLine && bookmark.line <= endLine) {
              // The bookmarked line was deleted or changed, remove the bookmark or update its content
              this.removeBookmark(bookmark);
            }
          }
        }
      }
    }

    this.refresh();
  }


private handleDocumentChange(e: vscode.TextDocumentChangeEvent): void {
  for (const change of e.contentChanges) {
    const startLine = change.range.start.line;
    const endLine = change.range.end.line;
    const lineDelta = change.text.split('\n').length - (endLine - startLine + 1);

    this.bookmarks = this.bookmarks.map(bookmark => {
      if (bookmark.path === e.document.uri.fsPath) {
        if (bookmark.line > startLine) {
          // Line number has changed, update it
          bookmark.line += lineDelta;
        } else if (bookmark.line >= startLine && bookmark.line <= endLine) {
          // The bookmarked line was changed, update its content
          bookmark.content = e.document.lineAt(bookmark.line).text.trim();
        }
      }
      return bookmark;
    });

    // Remove bookmarks that are no longer valid
    this.bookmarks = this.bookmarks.filter(bookmark => {
      if (bookmark.path === e.document.uri.fsPath) {
        return bookmark.line < e.document.lineCount && bookmark.content === e.document.lineAt(bookmark.line).text.trim();
      }
      return true;
    });
  }

  this.saveBookmarks();
  this.refresh();
}


private handleDocumentChange(e: vscode.TextDocumentChangeEvent): void {
  let refreshNeeded = false;
  let updateDBNeeded = false;

  const updatedBookmarks: Bookmark[] = [];

  for (const change of e.contentChanges) {
    const startLine = change.range.start.line;
    const endLine = change.range.end.line;
    const lineDelta = change.text.split('\n').length - (endLine - startLine + 1);

    this.bookmarks.forEach(bookmark => {
      if (bookmark.path === e.document.uri.fsPath) {
        if (bookmark.line > startLine) {
          bookmark.line += lineDelta;
          updatedBookmarks.push(bookmark);
          refreshNeeded = true;
          updateDBNeeded = true;
        } else if (bookmark.line >= startLine && bookmark.line <= endLine) {
          bookmark.content = e.document.lineAt(bookmark.line).text.trim();
          updatedBookmarks.push(bookmark);
          refreshNeeded = true;
          updateDBNeeded = true;
        }
      }
    });
  }

  // Remove deleted bookmarks
  this.bookmarks = this.bookmarks.filter(bookmark => {
    const lineExists = bookmark.line < e.document.lineCount;
    const contentMatches = bookmark.content === e.document.lineAt(bookmark.line).text.trim();
    return lineExists && contentMatches;
  });

  if (refreshNeeded) {
    this.refresh(); // Update the view
  }

  if (updateDBNeeded) {
    // Throttle this if needed to avoid excessive DB updates
    this.updateBookmarksInDB(updatedBookmarks); // Update the DB
  }
}

private async updateBookmarksInDB(updatedBookmarks: Bookmark[]): Promise<void> {
  try {
    // Your logic to update bookmarks in the Sandra DB
    // await this.proxyManager.sendRequest(null, 'bookmark:updateBookmarks', updatedBookmarks);
    this.saveBookmarks(); // Save bookmarks after successful DB update
  } catch (error) {
    vscode.window.showErrorMessage('Failed to update bookmarks in Sandra: ' + error.message);
  }
}


private async removeBookmarkElement(bookmarkElement: BookmarkLineElement | BookmarkFileElement | BookmarkAreaElement): Promise<void> {
    // Remove from the local model
    if (bookmarkElement instanceof BookmarkLineElement) {
        const parentElement = bookmarkElement.parent as BookmarkFileElement;
        const index = parentElement.children.findIndex(b => b === bookmarkElement);
        if (index !== -1) {
            parentElement.children.splice(index, 1);
        }
    } else if (bookmarkElement instanceof BookmarkFileElement) {
        const areaElement = bookmarkElement.parent as BookmarkAreaElement;
        areaElement.children = areaElement.children.filter(child => child !== bookmarkElement);
    } else if (bookmarkElement instanceof BookmarkAreaElement) {
        // This would remove an entire area with all its bookmarks
        this.bookmarks = this.bookmarks.filter(b => b.path.startsWith(bookmarkElement.bookmarkItem.path));
    }

    // Perform any additional cleanup or UI updates needed
    this.refreshDataTree(); // Refresh the tree view to reflect changes

    // Optionally, update the backend or storage if necessary
    await this.saveBookmarks(); // Assume saveBookmarks updates the backend or local storage
}

findBookmarkElement(bookmark: Bookmark): AbstractTreeBaseNode | undefined {
    // Assuming each BookmarkAreaElement represents a directory, and each BookmarkFileElement represents a file
    let areaElement = this.bookmarkAreas.find(area => bookmark.path.startsWith(area.bookmarkItem.path));
    if (!areaElement) return undefined; // If no area contains this path, it's not represented in the tree

    // Find the specific file element within the area
    let fileElement = areaElement.children.find(file => file.bookmark.path === bookmark.path);
    if (!fileElement) return areaElement; // Return the area element if no specific file is found

    // If it's a line bookmark, find the specific line element
    if (bookmark.type === 'line') {
        return fileElement.children.find(line => line.bookmark.line === bookmark.line);
    }

    return fileElement;
}

private async findBookmarkElement(bookmark: Bookmark): Promise<BookmarkLineElement | BookmarkFileElement | BookmarkAreaElement | undefined> {
    return (await this.children).find(area => area.children.some(file => file.children.some(line => line.bookmark.path === bookmark.path && line.bookbook.line === bookmark.line)));
}

private async findBookmarkElement(bookmark: Bookmark): Promise<BookmarkLineElement | BookmarkFileElement | BookmarkAreaElement | undefined> {
  const children = await this.children;
  for (const area of children) {
    for (const file of area.children) {
      const lineElement = file.children.find(line => line.bookmark.path === bookmark.path && line.bookmark.line === bookmark.line);
      if (lineElement) {
        return lineElement;
      }
    }
  }
  return undefined;
}

private async findBookmarkElement(bookmark: Bookmark): Promise<BookmarkLineElement | BookmarkFileElement | BookmarkAreaElement | undefined> {
  const children = await this.children;
  for (const area of children) {
    const fileElement = await this.findInArea(area, bookmark);
    if (fileElement) {
      return fileElement;
    }
  }
  return undefined;
}

private async findInArea(area: BookmarkAreaElement, bookmark: Bookmark): Promise<BookmarkLineElement | BookmarkFileElement | undefined> {
  for (const file of await area.getChildren()) {
    if (file instanceof BookmarkFileElement) {
      const lineElement = file.children.find(line => line.bookmark.path === bookmark.path && line.bookmark.line === bookmark.line);
      if (lineElement) {
        return lineElement;
      }
    }
  }
  return undefined;
}


def handle_removeBookmark(self, ctx, bookmark_to_remove: Dict) -> bool:
    """Removes a specific bookmark from the bookmarks object stored in Sandra."""
    try:
        # Fetch existing bookmarks from the database
        bookmarks_path = self._bookmark_path()
        obj = read_or_new_pymodule(self.db, bookmarks_path)
        if obj.text:
            bookmarks = eval(obj.text)
        else:
            bookmarks = []

        # Filter out the bookmark to be removed
        bookmarks = [bm for bm in bookmarks if not (bm['path'] == bookmark_to_remove['path'] and bm['line'] == bookmark_to_remove['line'])]

        # Save the updated list of bookmarks back to the database
        obj.text = repr(bookmarks)
        obj.write()
        self.db.commit()  # Ensure the transaction is saved

        return True
    except Exception as e:
        logger.error(f"Failed to remove bookmark: {str(e)}")
        return False

def _bookmark_path(self):
    """Constructs the bookmarks storage path within the Sandra database."""
    return f"{self.bookmark_dir}/bookmarks.py"



def handle_removeBookmark(self, ctx, bookmark_to_remove: Dict) -> bool:
    try:
        bookmarks = self.getBookmarks()

        # Flatten the nested list of bookmarks if necessary
        flat_bookmarks = self.flatten_bookmarks(bookmarks)

        logger.info(f"Flat bookmarks before removal: {flat_bookmarks}")

        updated_bookmarks = [
            bm for bm in flat_bookmarks
            if 'path' in bm and 'line' in bm
            if not (bm['path'] == bookmark_to_remove['path'] and bm['line'] == bookmark_to_remove['line'])
        ]
        
        logger.info(f"Bookmarks after removal: {updated_bookmarks}")

        if len(flat_bookmarks) == len(updated_bookmarks):
            return False  # No bookmark was removed, return False

        # Convert back to nested structure if necessary, or adjust the save function
        # to handle flat lists
        self._save_bookmarks(updated_bookmarks)
        return True
    except Exception as e:
        logger.error(f"Failed to remove bookmark: {str(e)}")
        return False

def flatten_bookmarks(self, bookmarks):
    """Flatten a list of possibly nested lists of bookmarks."""
    flat_list = []
    for item in bookmarks:
        if isinstance(item, list):
            flat_list.extend(self.flatten_bookmarks(item))  # Recursively flatten the list
        else:
            flat_list.append(item)
    return flat_list


def _bookmark_path(self, bookmark: Dict) -> str:
        """Constructs the bookmark storage path based on its parent directory, filename, and line number."""
        # Extract the parent directory name and filename from the path
        path = pathlib.Path(bookmark['path'])
        parent_dir_name = path.parent.name
        filename = path.name
        # Replace any characters that are not valid in filenames with '_'
        safe_name = f"{parent_dir_name}_{filename}".replace('/', '_').replace('\\', '_')
        return f"{self.bookmark_dir}/{safe_name}_{bookmark['line']}"

    def handle_addBookmark(self, ctx, bookmark: Dict) -> bool:
        """Adds a bookmark to the bookmarks list."""
        bm_path = self._bookmark_path(bookmark)
        obj = read_or_new_pymodule(self.db, bm_path)
        obj.text = repr(bookmark)
        obj.write()
        return True
    
    def getBookmarks(self) -> List[Dict]:
        """
        Retrieves all bookmarks from Sandra, including their metadata.
        """
        bookmarks = []
        for bm_path in sandra.walk(self.bookmark_dir, db=self.db, returnDirs=False):
            obj = read_or_new_pymodule(self.db, bm_path)
            bookmarks.append(eval(obj.text))
        return bookmarks

    def handle_removeBookmark(self, ctx, bookmark_to_remove: Dict) -> bool:
        """Removes a bookmark from the bookmarks list."""
        try:
            bm_path = self._bookmark_path(bookmark_to_remove)
            obj = read_or_new_pymodule(self.db, bm_path)
            obj.delete()
            return True
        except Exception as e:
            logger.error(f"Failed to remove bookmark: {str(e)}")
            return False



def handle_addBookmark(self, ctx, bookmark: Dict) -> bool:
    """Adds a bookmark to the bookmarks list."""
    if isinstance(bookmark, list):
        bookmarks = self.flatten_bookmarks(bookmark)
        for bookmark in bookmarks:
            if not isinstance(bookmark, dict):
                raise TypeError('bookmark must be a dictionary')
            if 'path' not in bookmark:
                raise ValueError('bookmark must have a path key')
            bm_path = self._bookmark_path(bookmark)
            obj = read_or_new_pymodule(self.db, bm_path)
            obj.text = repr(bookmark)
            obj.write()
    else:
        if not isinstance(bookmark, dict):
            raise TypeError('bookmark must be a dictionary')
        if 'path' not in bookmark:
            raise ValueError('bookmark must have a path key')
        bm_path = self._bookmark_path(bookmark)
        obj = read_or_new_pymodule(self.db, bm_path)
        obj.text = repr(bookmark)
        obj.write()
    return True


async updateBookmark(oldBookmark: Bookmark, newBookmark: Bookmark): Promise<void> {
  this.bookmarksLock = this.bookmarksLock.then(async () => {
    const result = await this.proxyManager.sendRequest('bookmark:updateBookmark', newBookmark);
    if (result) {
      this.bookmarks = this.bookmarks.filter(b => b.path !== oldBookmark.path || b.line !== oldBookmark.line);
      this.bookmarks.push(newBookmark);
      await this.saveBookmarks();
      const bookmarkAreas = await this.fetchBookmarkAreas();
      bookmarkAreas.forEach(area => {
        area.children.forEach(file => {
          file.children = file.children.map(line => new BookmarkLineElement(line.bookmark));
        });
      });
      this.refresh();
    } else {
      // If the update was not successful, show an error message
      vscode.window.showErrorMessage('Failed to update bookmark.');
    }
  });
}

handleDocumentChange(e: vscode.TextDocumentChangeEvent): void {
  for (const change of e.contentChanges) {
    const startLine = change.range.start.line;
    const endLine = change.range.end.line;
    const lineDelta = change.text.split('\n').length - (endLine - startLine + 1);

    this.bookmarksLock = this.bookmarksLock.then(() => {
      this.bookmarks.forEach(async (bookmark, index) => {
        if (bookmark.path === e.document.uri.fsPath) {
          if (bookmark.line >= startLine) {
            // The bookmarked line was changed, update its content
            const newContent = e.document.lineAt(bookmark.line).text.trim();
            // Line number has changed, update it
            const oldLine = bookmark.line;
            const newLine = oldLine + lineDelta;
            if (newLine !== oldLine || bookmark.content !== newContent) {
              // The bookmark has changed, update it
              const newBookmark = { ...bookmark, line: newLine, content: newContent };
              // Update the bookmark in the bookmarks array immediately
              this.bookmarks[index] = newBookmark;
              try {
                await this.updateBookmark(bookmark, newBookmark);
              } catch (error) {
                // If the update failed, revert the changes in the bookmarks array
                this.bookmarks[index] = bookmark;
              }
            }
          }
        }
      });
      this.refresh(); // Refresh the tree view after handling document change
    });
  }
}


private async fetchBookmarkAreas(): Promise<BookmarkAreaElement[]> {
  const areasMap = this.createAreasMap();
  const fileMap = this.createFileMap();

  this.sortAreasAndFiles(areasMap);

  return Array.from(areasMap.values());
}

private createAreasMap(): Map<string, BookmarkAreaElement> {
  const areasMap = new Map<string, BookmarkAreaElement>();

  this.bookmarks.forEach(bookmark => {
    if (!bookmark.path) {
      console.error('Bookmark is missing path:', bookmark);
      return;
    }

    const dirPath = pathModule.dirname(bookmark.path);
    let areaElement = areasMap.get(dirPath);
    if (!areaElement) {
      areaElement = new BookmarkAreaElement({type: 'folder', path: dirPath, line: 0}, undefined);
      areaElement.id = dirPath;
      areasMap.set(dirPath, areaElement);
    }
  });

  return areasMap;
}

private createFileMap(): Map<string, BookmarkFileElement> {
  const fileMap = new Map<string, BookmarkFileElement>();

  this.bookmarks.forEach(bookmark => {
    let fileElement = fileMap.get(bookmark.path);
    if (!fileElement) {
      fileElement = new BookmarkFileElement(bookmark, this.fileIcon);
      fileMap.set(bookmark.path, fileElement);
    }

    const lineElement = new BookmarkLineElement(bookmark);
    lineElement.parent = fileElement;
    fileElement.children.push(lineElement);
    fileElement.children.sort((a, b) => a.bookmark.line - b.bookmark.line);
  });

  return fileMap;
}

private sortAreasAndFiles(areasMap: Map<string, BookmarkAreaElement>): void {
  // Sort the areas by path
  const areasArray = Array.from(areasMap.values());
  areasArray.sort((a, b) => a.bookmarkItem.path.localeCompare(b.bookmarkItem.path));

  // Sort the file elements within each area
  areasArray.forEach(area => {
    area.children.sort((a, b) => a.bookmark.path.localeCompare(b.bookmark.path));
  });
}


// Event handler for document changes
handleDocumentChange(e: vscode.TextDocumentChangeEvent): void {
  e.contentChanges.forEach(change => {
    const startLine = change.range.start.line + 1; // Convert to 1-based index
    const endLine = change.range.end.line + 1;
    const lineDelta = change.text.split('\n').length - (endLine - startLine);

    this.bookmarks.forEach((bookmark, index) => {
      if (bookmark.path === e.document.uri.fsPath && bookmark.line >= startLine) {
        const newLine = bookmark.line + lineDelta;
        const newContent = e.document.lineAt(newLine - 1).text.trim(); // Adjust for zero-based index

        // Only proceed if there's a change to update
        if (bookmark.line !== newLine || bookmark.content !== newContent) {
          const oldBookmark = {...bookmark};
          const updatedBookmark = {...bookmark, line: newLine, content: newContent};

          // Perform the update asynchronously
          this.updateBookmark(oldBookmark, updatedBookmark).then(() => {
            this.bookmarks[index] = updatedBookmark; // Confirm the update on success
          }).catch(error => {
            console.error("Failed to update bookmark:", error);
            vscode.window.showErrorMessage("Failed to update bookmark due to an error.");
          });
        }
      }
    });
  });
  this.refresh(); // Refresh to update the UI if needed
}


async handleDocumentChange(e: vscode.TextDocumentChangeEvent): Promise<void> {
  for (const change of e.contentChanges) {
    const startLine = change.range.start.line;
    const endLine = change.range.end.line;
    const lineDelta = change.text.split('\n').length - 1 - (endLine - startLine);

    this.bookmarks = this.bookmarks.map(bookmark => {
      if (bookmark.path === e.document.uri.fsPath) {
        if (bookmark.line > endLine) {
          // The bookmark is below the change, adjust its line number
          return { ...bookmark, line: bookmark.line + lineDelta };
        } else if (bookmark.line >= startLine && bookmark.line <= endLine) {
          // The bookmark is within the change
          if (change.text === "") {
            // The bookmark's line was deleted, remove the bookmark
            return null;
          } else {
            // The bookmark's line was changed, update its content
            return { ...bookmark, content: e.document.lineAt(bookmark.line).text.trim() };
          }
        }
      }
      // The bookmark is not affected by the change
      return bookmark;
    }).filter(Boolean); // Remove null bookmarks

    // Refresh the tree view to reflect the changes
    this.refresh();
  }
}





updateDecorations(editor: vscode.TextEditor): void {
    if (!editor) {
        return;
    }

    // Clear existing decorations for this editor to prevent duplicates
    const filePath = editor.document.uri.fsPath;
    this.clearEditorDecorations(editor);

    // Apply decorations for all bookmarks related to this editor's document
    this.bookmarks.forEach((bookmark) => {
        if (bookmark.path === filePath) {
            const decorationType = this.getOrCreateDecorationTypeForBookmark(bookmark);
            const range = new vscode.Range(bookmark.line - 1, 0, bookmark.line - 1, 0);
            editor.setDecorations(decorationType, [range]);
        }
    });
}

clearEditorDecorations(editor: vscode.TextEditor): void {
    const filePath = editor.document.uri.fsPath;
    const keysToRemove = [];

    // Find all decorations for the current editor's file path
    for (let key of this.bookmarkDecorations.keys()) {
        if (key.startsWith(filePath)) {
            keysToRemove.push(key);
        }
    }

    // Dispose of the decorations and remove them from the map
    for (let key of keysToRemove) {
        this.bookmarkDecorations.get(key)?.dispose();
        this.bookmarkDecorations.delete(key);
    }
}

getOrCreateDecorationTypeForBookmark(bookmark: Bookmark): vscode.TextEditorDecorationType {
    const key = `${bookmark.path}:${bookmark.line}`;
    let decorationType = this.bookmarkDecorations.get(key);

    // If a decoration doesn't already exist, create a new one
    if (!decorationType) {
        decorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.file(this.context.asAbsolutePath('resources/bookmark.svg')),
            gutterIconSize: 'contain'
        });
        this.bookmarkDecorations.set(key, decorationType);
    }

    return decorationType;
}

async removeBookmark(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const line = editor.selection.active.line;
    const filePath = editor.document.uri.fsPath;

    // Find if there's a bookmark at the selected line
    const bookmarkToRemove = this.bookmarks.find(b => b.path === filePath && b.line === line + 1);

    if (bookmarkToRemove) {
        // If a bookmark exists at this line, proceed to remove it
        await this.executeRemoveBookmark(bookmarkToRemove);
    } else {
        vscode.window.showInformationMessage('No bookmark exists at the selected line.');
    }
}

vscode.window.onDidChangeTextEditorSelection(event => {
    const hasBookmark = this.bookmarks.some(b => 
        b.path === event.textEditor.document.uri.fsPath &&
        b.line === event.selections[0].start.line + 1
    );
    vscode.commands.executeCommand('setContext', 'bookmarkExistsOnLine', hasBookmark);
});


function handleTextEditorSelectionChange() {
    vscode.window.onDidChangeTextEditorSelection(event => {
        // Ensure we check the line where the cursor ends up, not just where it started.
        const line = event.selections[0].start.line;
        const filePath = event.textEditor.document.uri.fsPath;

        const hasBookmark = this.bookmarks.some(b => 
            b.path === filePath &&
            b.line === line + 1 // +1 because your bookmarks are likely stored in a 1-based index
        );

        vscode.commands.executeCommand('setContext', 'bookmarkExistsOnLine', hasBookmark);
    });
}

*register(): Generator<vscode.Disposable> {
    // ...
    yield vscode.commands.registerCommand('quartz.editBookmark', this.editBookmark, this);
    // ...
}

async editBookmark(bookmarkElement: BookmarkLineElement): Promise<void> {
    const oldBookmark = bookmarkElement.bookmark;
    const newBookmark = { ...oldBookmark }; // Create a copy of the old bookmark

    // Prompt the user to enter the new bookmark details
    const newLine = await vscode.window.showInputBox({ prompt: 'Enter the new line number', value: String(oldBookmark.line) });
    const newContent = await vscode.window.showInputBox({ prompt: 'Enter the new content', value: oldBookmark.content });

    if (newLine !== undefined) newBookmark.line = Number(newLine);
    if (newContent !== undefined) newBookmark.content = newContent;

    // Send a request to the server to update the bookmark
    const result = await this.proxyManager.sendRequest('bookmark:updateBookmark', { oldBookmark, newBookmark });

    if (result) {
        // Update the local state and refresh the tree view
        this.bookmarks = this.bookmarks.map(bm => bm.path === oldBookmark.path && bm.line === oldBookmark.line ? newBookmark : bm);
        await this.saveBookmarks();
        this.refresh();
    } else {
        vscode.window.showErrorMessage('Failed to edit bookmark.');
    }
}
