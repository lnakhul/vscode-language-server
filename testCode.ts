import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DotDirsSync } from '../dotDirsSync';
import { MockProxyManager } from './mocks/proxyManager';
import { expect, jest, test, describe, beforeEach, afterEach } from '@jest/globals';

jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        mkdir: jest.fn(),
        readdir: jest.fn(),
    },
    existsSync: jest.fn(),
}));

jest.mock('vscode', () => ({
    ...jest.requireActual('vscode'),
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
        onDidSaveTextDocument: jest.fn(),
    },
    window: {
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
    },
}));

describe('DotDirsSync Test Suite', () => {
    let dotDirsSync: DotDirsSync;
    let proxyManager: MockProxyManager;

    beforeEach(() => {
        proxyManager = new MockProxyManager();
        dotDirsSync = new DotDirsSync(proxyManager);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('uploadDotDirs', () => {
        test('should upload keybindings.json if it exists', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.promises.readFile as jest.Mock).mockResolvedValue('mock-content');
            const writeConfigFileSpy = jest.spyOn(dotDirsSync, 'writeConfigFile');

            await dotDirsSync['uploadDotDirs']();

            expect(writeConfigFileSpy).toHaveBeenCalledWith('.vscode/keybindings.json', 'mock-content');
        });

        test('should upload dot-prefixed folders', async () => {
            (fs.promises.readdir as jest.Mock).mockResolvedValue([
                { name: '.vscode', isDirectory: () => true },
                { name: '.git', isDirectory: () => true },
            ]);
            const uploadFolderSpy = jest.spyOn(dotDirsSync as any, 'uploadFolder').mockResolvedValue();

            await dotDirsSync['uploadDotDirs']();

            expect(uploadFolderSpy).toHaveBeenCalledWith('.vscode', '/mock/workspace/.vscode');
            expect(uploadFolderSpy).toHaveBeenCalledWith('.git', '/mock/workspace/.git');
        });
    });

    describe('downloadDotDirs', () => {
        test('should download keybindings.json from Sandra', async () => {
            jest.spyOn(dotDirsSync, 'listDotDirs').mockResolvedValue(['.vscode']);
            jest.spyOn(dotDirsSync, 'listConfigFiles').mockResolvedValue(['keybindings.json']);
            jest.spyOn(dotDirsSync, 'readConfigFile').mockResolvedValue('mock-content');
            const writeFileContentSpy = jest.spyOn(fs.promises, 'writeFile');

            await dotDirsSync['downloadDotDirs']();

            expect(writeFileContentSpy).toHaveBeenCalledWith(
                expect.stringContaining('keybindings.json'),
                'mock-content'
            );
        });

        test('should download other dot-prefixed folders', async () => {
            jest.spyOn(dotDirsSync, 'listDotDirs').mockResolvedValue(['.git']);
            jest.spyOn(dotDirsSync, 'listConfigFiles').mockResolvedValue(['config']);
            jest.spyOn(dotDirsSync, 'readConfigFile').mockResolvedValue('mock-content');
            const writeFileContentSpy = jest.spyOn(fs.promises, 'writeFile');

            await dotDirsSync['downloadDotDirs']();

            expect(writeFileContentSpy).toHaveBeenCalledWith(
                expect.stringContaining('/mock/workspace/.git/config'),
                'mock-content'
            );
        });
    });

    describe('handleTextDocumentSave', () => {
        test('should upload keybindings.json on save', async () => {
            const mockDoc = { uri: { fsPath: '/mock/keybindings.json' }, getText: jest.fn().mockReturnValue('mock-content') } as any;
            jest.spyOn(dotDirsSync, 'writeConfigFile').mockResolvedValue();
            jest.spyOn(dotDirsSync, 'keybindingsPath', 'get').mockReturnValue(vscode.Uri.file('/mock/keybindings.json'));

            await dotDirsSync['handleTextDocumentSave'](mockDoc);

            expect(dotDirsSync['writeConfigFile']).toHaveBeenCalledWith('.vscode/keybindings.json', 'mock-content');
        });

        test('should not upload non-keybindings.json files', async () => {
            const mockDoc = { uri: { fsPath: '/mock/other-file.json' }, getText: jest.fn() } as any;
            const writeConfigFileSpy = jest.spyOn(dotDirsSync, 'writeConfigFile');

            await dotDirsSync['handleTextDocumentSave'](mockDoc);

            expect(writeConfigFileSpy).not.toHaveBeenCalled();
        });
    });

    describe('syncAllDotDirs', () => {
        test('should call uploadDotDirs and downloadDotDirs', async () => {
            const uploadSpy = jest.spyOn(dotDirsSync as any, 'uploadDotDirs').mockResolvedValue();
            const downloadSpy = jest.spyOn(dotDirsSync as any, 'downloadDotDirs').mockResolvedValue();

            await dotDirsSync.syncAllDotDirs();

            expect(uploadSpy).toHaveBeenCalled();
            expect(downloadSpy).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Dot-dirs sync complete.');
        });
    });
});
