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
