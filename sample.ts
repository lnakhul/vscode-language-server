import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { BookmarksDataProvider, Bookmark, BookmarkLineElement, BookmarkFileElement, BookmarkAreaElement } from '../src/bookmarkExplorer';

suite('BookmarkExplorer Tests', () => {
    let dataProvider: BookmarksDataProvider;
    let proxyManagerStub: any;

    setup(() => {
        proxyManagerStub = {
            sendRequest: sinon.stub(),
            state: ProxyProcessState.Connected
        };
        dataProvider = new BookmarksDataProvider(proxyManagerStub, 'test-id');
    });

    teardown(() => {
        sinon.restore();
    });

    test('Add Bookmark', async () => {
        const bookmark: Bookmark = { type: 'line', path: '/path/to/file', line: 10, content: 'test content' };
        proxyManagerStub.sendRequest.resolves(true);

        await dataProvider._addBookmark(bookmark);

        assert.ok(proxyManagerStub.sendRequest.calledOnce);
        assert.deepStrictEqual(dataProvider.bookmarks[0], bookmark);
    });

    test('Remove Bookmark', async () => {
        const bookmark: Bookmark = { type: 'line', path: '/path/to/file', line: 10, content: 'test content' };
        dataProvider.bookmarks.push(bookmark);

        proxyManagerStub.sendRequest.resolves(true);

        await dataProvider.removeBookmark(bookmark);

        assert.ok(proxyManagerStub.sendRequest.calledWith(null, 'bookmark:removeBookmark', { path: bookmark.path, line: bookmark.line }));
        assert.strictEqual(dataProvider.bookmarks.length, 0);
    });

    test('Fetch Bookmarks', async () => {
        const bookmarks: Bookmark[] = [
            { type: 'line', path: '/path/to/file1', line: 10, content: 'test content 1' },
            { type: 'line', path: '/path/to/file2', line: 20, content: 'test content 2' }
        ];
        proxyManagerStub.sendRequest.resolves(bookmarks);

        await dataProvider.loadBookmarks();

        assert.ok(proxyManagerStub.sendRequest.calledOnceWith(null, 'bookmark:getBookmarks'));
        assert.strictEqual(dataProvider.bookmarks.length, bookmarks.length);
    });
});






import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { BookmarksDataProvider, Bookmark, BookmarkLineElement, BookmarkFileElement, BookmarkAreaElement } from '../src/bookmarkExplorer';

suite('BookmarkExplorer Tests', () => {
    let dataProvider: BookmarksDataProvider;
    let proxyManagerStub: any;

    setup(() => {
        proxyManagerStub = {
            sendRequest: sinon.stub(),
            state: ProxyProcessState.Connected
        };
        dataProvider = new BookmarksDataProvider(proxyManagerStub, 'test-id');
    });

    teardown(() => {
        sinon.restore();
    });

    test('Add Bookmark - Already Exists', async () => {
        const bookmark: Bookmark = { type: 'line', path: '/path/to/file', line: 10, content: 'test content' };
        dataProvider.bookmarks.push(bookmark); // Mock existing bookmark
        await dataProvider._addBookmark(bookmark);
        assert.strictEqual(proxyManagerStub.sendRequest.called, false, 'Should not call sendRequest if bookmark exists');
    });

    test('Remove Bookmark - Not Found', async () => {
        const bookmark: Bookmark = { type: 'line', path: '/path/to/missingfile', line: 10, content: 'missing content' };
        await dataProvider.removeBookmark(bookmark);
        assert.strictEqual(proxyManagerStub.sendRequest.called, false, 'Should not attempt to remove a non-existent bookmark');
    });

    test('Load Bookmarks - Server Error', async () => {
        proxyManagerStub.sendRequest.rejects(new Error('Server error'));
        await assert.rejects(() => dataProvider.loadBookmarks(), /Server error/, 'Should handle and throw server errors');
    });

    test('Refresh Data Tree - Simulate Change', async () => {
        const bookmark: Bookmark = { type: 'line', path: '/new/path', line: 5, content: 'new content' };
        dataProvider.bookmarks.push(bookmark);
        await dataProvider.refresh();
        assert.strictEqual(dataProvider.lastUpdated instanceof Date, true, 'lastUpdated should be set after refresh');
        assert.ok(proxyManagerStub.sendRequest.calledWith(null, 'bookmark:getBookmarks'), 'Should fetch bookmarks on refresh');
    });

    test('Update Bookmark on Document Change', async () => {
        const bookmark: Bookmark = { type: 'line', path: '/changed/path', line: 1, content: 'original content' };
        dataProvider.bookmarks.push(bookmark);
        const changeEvent = {
            document: { uri: vscode.Uri.file('/changed/path') },
            contentChanges: [{ range: new vscode.Range(0, 0, 0, 0), text: 'new line\n' }]
        };
        dataProvider.handleDocumentChange(changeEvent as vscode.TextDocumentChangeEvent);
        assert.strictEqual(dataProvider.bookmarks[0].line, 2, 'Should update line number due to content change');
    });

    test('Clear All Bookmarks', async () => {
        await dataProvider.clearAllBookmarks();
        assert.ok(proxyManagerStub.sendRequest.calledWith(null, 'bookmark:clearBookmarks'), 'Should call the clearAllBookmarks API');
        assert.strictEqual(dataProvider.bookmarks.length, 0, 'Should empty the internal bookmarks array');
    });

    test('Open and Navigate to Bookmark', async () => {
        const bookmark: Bookmark = { type: 'line', path: '/navigate/to', line: 1, content: 'go to line' };
        dataProvider.bookmarks.push(bookmark);
        const openStub = sinon.stub(vscode.workspace, 'openTextDocument').resolves({
            lineCount: 100,
            lineAt: () => ({ text: 'go to line' })
        } as any);
        const showTextDocumentStub = sinon.stub(vscode.window, 'showTextDocument').resolves();

        await dataProvider.openBookmark(bookmark);
        assert.ok(openStub.calledOnce, 'Should open the document');
        assert.ok(showTextDocumentStub.calledOnce, 'Should display the document');
    });

    // More tests could be added for edge cases, multiple concurrent operations, and testing of UI components where necessary.
});







import { BookmarkLineElement } from './bookmarks';

describe('BookmarkLineElement', () => {
  it('should create a BookmarkLineElement with label and tooltip', () => {
    const bookmark = { type: 'line', path: 'test.txt', line: 10, content: 'This is a bookmark' };
    const element = new BookmarkLineElement(bookmark);

    expect(element.label).toBe('Line: 10');
    expect(element.tooltip).toBe('test.txt (Line: 10)');
    expect(element.iconPath).toBe(new vscode.ThemeIcon('symbol-method'));
  });

  it('should create a BookmarkLineElement with content in label if provided', () => {
    const bookmark = { type: 'line', path: 'test.txt', line: 10, content: 'This is a bookmark content' };
    const element = new BookmarkLineElement(bookmark);

    expect(element.label).toBe('This is a bookmark content');
  });

  it('should get the tree item with label, description, icon, and command', async () => {
    const bookmark = { type: 'line', path: 'test.txt', line: 10, content: 'This is a bookmark content' };
    const element = new BookmarkLineElement(bookmark);
    const treeItem = await element.getTreeItem();

    expect(treeItem.label).toBe('This is a bookmark content');
    expect(treeItem.description).toBe('(Line: 10)');
    expect(treeItem.iconPath).toBe(new vscode.ThemeIcon('symbol-method'));
    expect(treeItem.command).toEqual({
      command: 'quartz.openBookmark',
      title: 'Open file',
      arguments: [bookmark],
    });
  });
});



import { BookmarkFileElement } from './bookmarks';
import * as path from 'path';

describe('BookmarkFileElement', () => {
  it('should create a BookmarkFileElement with label and resourceUri', () => {
    const bookmark = { type: 'line', path: 'test/folder/file.txt', line: 10 };
    const element = new BookmarkFileElement(bookmark, new vscode.ThemeIcon('file'));

    expect(element.label).toBe('file.txt');
    expect(element.resourceUri.fsPath).toBe(path.join('test', 'folder', 'file.txt'));
  });

  it('should get children as empty array initially', async () => {
    const bookmark = { type: 'line', path: 'test.txt', line: 10 };
    const element = new BookmarkFileElement(bookmark, new vscode.ThemeIcon('file'));
    const children = await element.getChildren();

    expect(children).toEqual([]);
  });

  it('should create a tree item with label, description, icon, and resourceUri', async () => {
    const bookmark = { type: 'line', path: 'test.txt', line: 10 };
    const element = new BookmarkFileElement(bookmark, new vscode.ThemeIcon('file'));
    const treeItem = await element.getTreeItem();

    expect(treeItem.label).toBe('test.txt');
    expect(treeItem.description).toBe('');
    expect(treeItem.iconPath).toBe(new vscode.ThemeIcon('file'));
    expect(treeItem.resourceUri.fsPath).toBe('test.txt');
  });

  it('should create a tree item with description for child bookmarks', async () => {
    const bookmark1 = { type: 'line', path: 'test.txt', line: 10 };
    const bookmark2 = { type: 'line', path: 'test.txt', line: 20 };
    const element = new BookmarkFileElement(bookmark1, new vscode.ThemeIcon('file'));
    element.children.push(new BookmarkLineElement(bookmark1));
    element.children.push(new BookmarkLineElement(bookmark2));
    const treeItem = await element.getTreeItem();

    expect(treeItem.description).toBe('2 bookmarks');
  });

  it('should create file decoration with number of bookmarks', () => {
    const uri = vscode.Uri.parse('quartz-bookmark-view://file/test.txt


import { Bookmark, BookmarkAreaElement, BookmarkFileElement, BookmarkLineElement, BookmarksDataProvider } from './bookmarkExplorer';
import { ProxyManager, ProxyProcessState } from './proxyManager';

test('Test Bookmark data provider', async () => {
    // Mock the ProxyManager
    const proxyManager = {
        state: ProxyProcessState.Connected,
        sendRequest: jest.fn(),
    } as unknown as ProxyManager;

    // Create the data provider
    const dataProvider = new BookmarksDataProvider(proxyManager, 'testId');

    // Create a bookmark and its corresponding elements
    const bookmark: Bookmark = {
        type: 'file',
        path: 'test/path',
        line: 1,
        name: 'Test Bookmark',
        content: 'Test Content',
    };
    const lineElement = new BookmarkLineElement(bookmark);
    const fileElement = new BookmarkFileElement(bookmark, { id: 'file', color: { id: 'blue' } });
    fileElement.children.push(lineElement);
    const areaElement = new BookmarkAreaElement(bookmark);
    areaElement.children.push(fileElement);

    // Test getChildren method
    let children = await dataProvider.getChildren(areaElement);
    expect(children).toBeDefined();
    expect(children.length).toBe(1);
    expect(children[0]).toBe(fileElement);

    children = await dataProvider.getChildren(fileElement);
    expect(children).toBeDefined();
    expect(children.length).toBe(1);
    expect(children[0]).toBe(lineElement);

    // Test getTreeItem method
    let treeItem = dataProvider.getTreeItem(areaElement);
    expect(treeItem).toBeDefined();
    expect(treeItem.label).toBe(areaElement.id);

    treeItem = dataProvider.getTreeItem(fileElement);
    expect(treeItem).toBeDefined();
    expect(treeItem.label).toBe(fileElement.label);
});

test('Test Add Bookmark', async () => {
    // Mock the active text editor
    const mockTextEditor = {
        document: {
            uri: vscode.Uri.file(bookmark.path),
            lineAt: jest.fn().mockReturnValue({ text: bookmark.content }),
        },
        selection: { active: { line: bookmark.line - 1 } },
    };
    vscode.window.activeTextEditor = mockTextEditor;

    // Call the addBookmark method
    await bookmarkDataProvider.addBookmark();

    // Expect sendRequest to have been called correctly for adding
    expect(proxyManager.sendRequest).toHaveBeenCalledWith(null, 'bookmark:addBookmark', expect.objectContaining({
        path: bookmark.path,
        line: bookmark.line,
        content: bookmark.content
    }));

    const bookmarks = await bookmarkDataProvider.getBookmark(bookmark.path);
    expect(bookmarks).toContainEqual(bookmark);

    // Test the bookmark is correctly added to the tree
    const root = await bookmarkDataProvider.getChildren();
    expect(root).toBeDefined();
    expect(root.length).toBe(1);
    expect(root[0].bookmark).toEqual(bookmark);

    const fileElement = await bookmarkDataProvider.getChildren(root[0]);
    expect(fileElement).toBeDefined();
    expect(fileElement.length).toBe(1);
    expect(fileElement[0].bookmark).toEqual(bookmark);

    const lineElement = await bookmarkDataProvider.getChildren(fileElement[0]);
    expect(lineElement).toBeDefined();
    expect(lineElement.length).toBe(1);
    expect(lineElement[0].bookmark).toEqual(bookmark);
});


    test('Update Bookmark on Document Change', async () => {
        const documentUri = vscode.Uri.file('/a/b/c/d.py');
        const documentChange = {
            document: { uri: documentUri },
            contentChanges: [{ range: new vscode.Range(0, 0, 0, 0), text: 'new content' }]
        };
        const bookmark: Bookmark = { type: 'line', path: '/a/b/c/d.py', line: 1, content: 'original content' };
        bookmarkDataProvider.bookmarks.push(bookmark);
        bookmarkDataProvider.handleDocumentChange(documentChange);
        expect(bookmark.content).toBe('new content');

        // Test the bookmark is correctly updated in the tree
        const root = await bookmarkDataProvider.getChildren(areaElement);
        expect(root).toBeDefined();
        expect(root.length).toBe(1);

        const fileElement = await bookmarkDataProvider.getChildren(root[0]);
        expect(fileElement).toBeDefined();

        const lineElement = await bookmarkDataProvider.getChildren(fileElement[0]);
        expect(lineElement).toBeDefined();
        expect(lineElement.length).toBe(1);

        const lineElementChildren = await bookmarkDataProvider.getChildren(lineElement[0]);
        expect(lineElementChildren).toBeDefined();
        expect(lineElementChildren.length).toBe(0);
    });
