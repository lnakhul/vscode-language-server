import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import { LogHelper } from '../logHelper';
import { MockProxyManager } from '../mocks/proxyManager';
import { SourceCache } from './sourceCache';
import { mock } from 'jest-mock-extended';
import { expect, test } from '@jest/globals';
import { MockInstanceStore } from '../utils';
import { container, cleanupTestContainer, prepareTestContainers } from '../testDi';

jest.mock("../../logging");

jest.mock('fs', () => ({
   readdir: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
}));

jest.mock('util', () => {
    const actualUtil = jest.requireActual('util');
    actualUtil.promisify = jest.fn().mockImplementation();
    return actualUtil;
});


describe('LogHelper test Test', () => {
    let logHelper: LogHelper;
    let mockProxyManager: MockProxyManager;
    let mockSourceCache: SourceCache;

    const mockInstanceStore = new MockInstanceStore();

    beforeAll(() => {
        prepareTestContainers();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        mockSourceCache = mock<SourceCache>();
        logHelper = new LogHelper(mockSourceCache, mockProxyManager);
    });

    afterEach(() => {
        mockInstanceStore.restore();
        jest.clearAllMocks();
    });

    describe('handleUri', () => {
        test('should handle URI with valid path', async () => {
            const mockLogs = [{ url: 'test', logContent: 'content' }];
            mockProxyManager.sendRequest.mockResolvedValue(mockLogs);
            const uri = vscode.Uri.parse('quartz-extension-log://authority/path?path=test');

            await logHelper.handleUri(uri);

            expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(uri);
            expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mock.Anything());
            expect(mockProxyManager.sendRequest).toHaveBeenCalledWith(null, 'retrieveLogs', { url: 'test' });
            expect(logHelper.cacheResults.get('test')).toBe('content');
        });

        test('should handle URI with missing path parameter', async () => {
            const uri = vscode.Uri.parse('quartz-extension-log://authority/path');

            await logHelper.handleUri(uri);

            expect(vscode.workspace.openTextDocument).not.toHaveBeenCalled();
            expect(vscode.window.showTextDocument).not.toHaveBeenCalled();
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Invalid URI. The "path" parameter is missing.');
        });

        test('should handle URI with invalid path parameter', async () => {
            const uri = vscode.Uri.parse('quartz-extension-log://authority/path?path=invalidPath');
            mockProxyManager.sendRequest.mockRejectedValue(new Error('Invalid log path'));

            await logHelper.handleUri(uri);

            expect(vscode.workspace.openTextDocument).not.toHaveBeenCalled();
            expect(vscode.window.showTextDocument).not.toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to retrieve log content.');
        });

        test('should handle URI with cached content', async () => {
            const mockLogs = [{ url: 'test', logContent: 'content' }];
            logHelper.cacheResults.set('test', 'cachedContent');
            mockProxyManager.sendRequest.mockResolvedValue(mockLogs);
            const uri = vscode.Uri.parse('quartz-extension-log://authority/path?path=test');

            await logHelper.handleUri(uri);

            expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(uri);
            expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mock.Anything());
            expect(mockProxyManager.sendRequest).not.toHaveBeenCalled(); // Not called due to cache hit
            expect(logHelper.cacheResults.get('test')).toBe('cachedContent');
        });
    });

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import { LogHelper } from '../logHelper';
import { MockProxyManager } from '../mocks/proxyManager';
import { SourceCache } from './sourceCache';
import { mock } from 'jest-mock-extended';
import { expect, test } from '@jest/globals';
import { MockInstanceStore } from '../utils';
import { container, cleanupTestContainer, prepareTestContainers } from '../testDi';

jest.mock("../../logging");

jest.mock('fs', () => ({
   readdir: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
}));

jest.mock('util', () => {
    const actualUtil = jest.requireActual('util');
    actualUtil.promisify = jest.fn().mockImplementation();
    return actualUtil;
});


describe('LogHelper test Test', () => {
    let logHelper: LogHelper;
    let mockProxyManager: MockProxyManager;
    let mockSourceCache: SourceCache;

    const mockInstanceStore = new MockInstanceStore();

    beforeAll(() => {
        prepareTestContainers();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        mockSourceCache = mock<SourceCache>();
        logHelper = new LogHelper(mockSourceCache, mockProxyManager);
    });

    afterEach(() => {
        mockInstanceStore.restore();
        jest.clearAllMocks();
    });

    describe('handleUri', () => {
        // ... existing tests for handleUri ...

    });

    test('should provide text document content', async () => {
        const mockLogs = [{ url: 'test', logContent: 'content' }];
        logHelper.cacheResults.set('test', 'cachedContent');
        const uri = vscode.Uri.parse('quartz-extension-log://authority/path?path=test');

        const content = await logHelper.provideTextDocumentContent(uri);

        expect(content).toBe('cachedContent');
    });

    test('should return undefined for uncached content and failed retrieval', async () => {
        const uri = vscode.Uri.parse('quartz-extension-log://authority/path?path=test');
        mockProxyManager.sendRequest.mockRejectedValue(new Error('Failed to retrieve logs'));

        const content = await logHelper.provideTextDocumentContent(uri);

        expect(content).toBeUndefined();
        expect(mockProxyManager.sendRequest).toHaveBeenCalledWith(null, 'retrieveLogs', { url: 'test' });
    });

    describe('uploadLogsToSandra', () => {
        test('should upload logs successfully', async () => {
            const mockLogs = ['path/to/file1', 'path/to/file2'];
            const expectedResults = [
                { fileName: 'file1', logContent: 'base64Content1' },
                { fileName: 'file2', logContent: 'base64Content2' },
            ];
            (util.promisify as jest.Mock).mockImplementation((fn) => (...args) => fn(...args));
            fs.readFile.mockImplementation((path) => Promise.resolve(`content for ${path}`));
            zlib.gzip.mockReturnValue(Buffer.from('base64Content'));
            mockProxyManager.sendRequest.mockResolvedValue(expectedResults);

            const results = await logHelper.uploadLogsToSandra(mockLogs);

            expect(results).toEqual(expectedResults);
            expect(fs.readFile).toHaveBeenCalledTimes(mockLogs.length);
            expect(zlib.gzip).toHaveBeenCalledTimes(mockLogs.length);
            expect(mockProxyManager.sendRequest).toHaveBeenCalledWith(null, 'uploadLogs', expectedResults);
        });

        test('should handle errors during upload', async () => {
    const mockLogs = ['path/to/file'];
    (util.promisify as jest.Mock).mockImplementation((fn) => (...args) => fn(...args));
    fs.readFile.mockImplementation(() => Promise.reject(new Error('Failed to read file')));
    mockProxyManager.sendRequest.mockRejectedValue(new Error('Upload failed'));

    await expect(logHelper.uploadLogsToSandra(mockLogs)).rejects.toThrowError('Failed to upload log files to Sandra.');
    expect(fs.readFile).toHaveBeenCalledTimes(1);
    expect(zlib.gzip).not.toHaveBeenCalled();
    expect(mockProxyManager.sendRequest).not.toHaveBeenCalled();
});
