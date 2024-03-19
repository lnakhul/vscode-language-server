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


import * as vscode from 'vscode';
import { LogHelper } from '../logHelper';
import { ProxyManager } from './proxyManager'; // Adjust this import according to your project structure
import { mock } from 'jest-mock-extended';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('vscode', () => ({
    commands: {
        registerCommand: jest.fn(),
    },
    workspace: {
        registerTextDocumentContentProvider: jest.fn(),
        openTextDocument: jest.fn().mockResolvedValue({}),
    },
    window: {
        showTextDocument: jest.fn().mockResolvedValue({}),
        showInformationMessage: jest.fn().mockResolvedValue({}),
        showErrorMessage: jest.fn().mockResolvedValue({}),
        showInputBox: jest.fn().mockResolvedValue(''),
    },
    Uri: {
        parse: jest.fn().mockReturnValue({}),
        file: jest.fn().mockReturnValue({}),
    },
    env: {
        openExternal: jest.fn().mockResolvedValue(undefined),
    },
    ProgressLocation: {
        Notification: {},
    },
}));

jest.mock('fs');
jest.mock('os');
jest.mock('path');
jest.mock('util', () => ({
    ...jest.requireActual('util'),
    promisify: jest.fn().mockImplementation((fn) => fn),
}));
jest.mock('zlib', () => ({
    gzip: jest.fn((input, callback) => callback(null, Buffer.from(input))),
}));

describe('LogHelper Tests', () => {
    let logHelper: LogHelper;
    let mockProxyManager: ReturnType<typeof mock>;

    beforeEach(() => {
        mockProxyManager = mock<ProxyManager>();
        logHelper = new LogHelper(mockProxyManager, new SourceCache()); // Assuming SourceCache is correctly instantiated or mocked
    });

    test('handleUri opens and shows the document', async () => {
        const mockUri = vscode.Uri.parse('quartz-extension-log://authority/path?path=test');
        await logHelper.handleUri(mockUri);

        expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
        expect(vscode.window.showTextDocument).toHaveBeenCalled();
    });

    test('provideTextDocumentContent returns log content', async () => {
        const testPath = 'testPath';
        logHelper.cacheResults.set(testPath, 'Test log content');
        const content = await logHelper.provideTextDocumentContent(vscode.Uri.parse(`quartz-extension-log://authority/path?path=${testPath}`));

        expect(content).toBe('Test log content');
    });

    test('openLogHandler opens external URI', async () => {
        await logHelper.openLogHandler(vscode.Uri.parse('quartz-extension-log://authority/path?path=test'));

        expect(vscode.env.openExternal).toHaveBeenCalled();
    });

    test('sendLogsHandler uploads logs and shows information message', async () => {
        mockProxyManager.sendRequest.mockResolvedValue([
            { fileName: 'test', logContent: 'content', url: 'test' },
        ]);
        logHelper.getRecentLogs = jest.fn().mockResolvedValue(['test']);
        logHelper.uploadLogsToSandra = jest.fn().mockResolvedValue([{ fileName: 'test', logContent: 'content', url: 'test' }]);

        await logHelper.sendLogsHandler();

        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Log files uploaded successfully.');
    });

    // Add more tests here following the same structure for other functionalities
});


             test('should get recent logs', async () => {
    class MockDirent {
        name: string;
        constructor(name: string) {
            this.name = name;
        }
        isFile() {
            return true;
        }
        isDirectory() {
            return false;
        }
    }

    const readdirMock = fs.readdir as jest.MockedFunction<typeof fs.readdir>;
    const statMock = fs.stat as jest.MockedFunction<typeof fs.stat>;
    const tmpdirMock = jest.spyOn(os, 'tmpdir');

    tmpdirMock.mockReturnValue('/tmp');
    readdirMock.mockImplementation((path, options) => {
        if (options && options.withFileTypes) {
            return Promise.resolve([new MockDirent('quartz_vscode_extension_test')]);
        } else {
            return Promise.resolve(['vscode_test']);
        }
    });
    statMock.mockImplementation(() => Promise.resolve({ isFile: () => true, birthtime: new Date() }));

    const logs = await logHelper.getRecentLogs();

    expect(logs).toEqual(['/tmp/quartz/vscode_extension_test/vscode_test']);
});
