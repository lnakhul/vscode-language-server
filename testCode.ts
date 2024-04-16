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
