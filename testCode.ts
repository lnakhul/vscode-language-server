import * as vscode from 'vscode';
import { UserProviderTreeDataProvider, ProviderNode, UserProviderTreeNode } from '../userProviderTree';
import { QuartzShellProvider } from '../quartzShell';
import { QuartzShellCollection } from '../quartzShellCollection';
import { QuartzExtensionSettings } from '../quartzExtensionSettings';
import { MockProxyManager } from './mocks/proxyManager';
import { MockInstanceStore } from './utils';
import { expect, jest, test, describe, beforeEach, afterEach } from '@jest/globals';

jest.mock('../../logging');

const mockProviders = [
    { id: 'provider1', displayName: 'Provider 1' },
    { id: 'provider2', displayName: 'Provider 2' }
];

const mockRootItems = [
    { id: 'root1', label: 'Root 1', hasChildren: true },
    { id: 'root2', label: 'Root 2', hasChildren: false }
];

const mockChildItems = [
    { id: 'child1', label: 'Child 1', hasChildren: false },
    { id: 'child2', label: 'Child 2', hasChildren: true }
];

let shellProvider: QuartzShellProvider;
let shellCollection: QuartzShellCollection;
let settings: QuartzExtensionSettings;
let dataProvider: UserProviderTreeDataProvider;
const mockedInstances = new MockInstanceStore();

describe('UserProviderTreeDataProvider Test Suite', () => {
    beforeEach(() => {
        shellCollection = new QuartzShellCollection();
        shellProvider = new QuartzShellProvider(shellCollection);
        settings = new QuartzExtensionSettings();
        dataProvider = new UserProviderTreeDataProvider(shellProvider, settings);

        jest.spyOn(shellProvider, 'listTreeProviders').mockResolvedValue(mockProviders);
        jest.spyOn(dataProvider, 'getRootItems').mockResolvedValue(mockRootItems);
        jest.spyOn(dataProvider, 'getChildItems').mockResolvedValue(mockChildItems);
    });

    afterEach(() => {
        mockedInstances.restore();
        jest.clearAllMocks();
    });

    describe('listTreeProviders', () => {
        test('should fetch and return a list of providers', async () => {
            const providers = await dataProvider.listTreeProviders();
            expect(providers).toEqual(mockProviders);
        });

        test('should handle empty provider list', async () => {
            jest.spyOn(shellProvider, 'listTreeProviders').mockResolvedValue([]);
            const providers = await dataProvider.listTreeProviders();
            expect(providers).toEqual([]);
        });
    });

    describe('getRootItems', () => {
        test('should fetch and return root items for a provider', async () => {
            const rootItems = await dataProvider.getRootItems('provider1');
            expect(rootItems).toEqual(mockRootItems);
        });

        test('should handle empty root items', async () => {
            jest.spyOn(dataProvider, 'getRootItems').mockResolvedValue([]);
            const rootItems = await dataProvider.getRootItems('provider1');
            expect(rootItems).toEqual([]);
        });
    });

    describe('getChildItems', () => {
        test('should fetch and return child items for a parent node', async () => {
            const childItems = await dataProvider.getChildItems('provider1', { id: 'root1', hasChildren: true });
            expect(childItems).toEqual(mockChildItems);
        });

        test('should handle empty child items', async () => {
            jest.spyOn(dataProvider, 'getChildItems').mockResolvedValue([]);
            const childItems = await dataProvider.getChildItems('provider1', { id: 'root1', hasChildren: true });
            expect(childItems).toEqual([]);
        });
    });

    describe('getChildren', () => {
        test('should return provider nodes at the top level', async () => {
            const children = await dataProvider.getChildren();
            expect(children).toHaveLength(mockProviders.length);
            expect(children[0]).toBeInstanceOf(ProviderNode);
            expect(children[0].providerId).toBe('provider1');
        });

        test('should return root items for a provider node', async () => {
            const providerNode = new ProviderNode('provider1', 'Provider 1', dataProvider);
            const children = await dataProvider.getChildren(providerNode);
            expect(children).toHaveLength(mockRootItems.length);
            expect(children[0]).toBeInstanceOf(UserProviderTreeNode);
            expect(children[0].data.id).toBe('root1');
        });

        test('should return child items for a user provider tree node', async () => {
            const parentNode = new UserProviderTreeNode(
                { id: 'root1', label: 'Root 1', hasChildren: true },
                'provider1',
                dataProvider
            );
            const children = await dataProvider.getChildren(parentNode);
            expect(children).toHaveLength(mockChildItems.length);
            expect(children[0]).toBeInstanceOf(UserProviderTreeNode);
            expect(children[0].data.id).toBe('child1');
        });

        test('should return an empty array for a leaf node', async () => {
            const leafNode = new UserProviderTreeNode(
                { id: 'child1', label: 'Child 1', hasChildren: false },
                'provider1',
                dataProvider
            );
            const children = await dataProvider.getChildren(leafNode);
            expect(children).toEqual([]);
        });
    });

    describe('refresh', () => {
        test('should refresh the tree and fetch providers', async () => {
            const fireSpy = jest.spyOn(dataProvider['_onDidChangeTreeData'], 'fire');
            await dataProvider.refresh();
            expect(fireSpy).toHaveBeenCalledWith(undefined);
            expect(dataProvider['_rootNodes']).toHaveLength(mockProviders.length);
        });

        test('should handle errors during refresh', async () => {
            jest.spyOn(dataProvider, 'listTreeProviders').mockRejectedValue(new Error('Test Error'));
            const fireSpy = jest.spyOn(dataProvider['_onDidChangeTreeData'], 'fire');
            await expect(dataProvider.refresh()).resolves.toBeUndefined();
            expect(fireSpy).toHaveBeenCalledWith(undefined);
            expect(dataProvider['_rootNodes']).toHaveLength(0);
        });
    });

    describe('getTreeItem', () => {
        test('should return a tree item for a provider node', async () => {
            const providerNode = new ProviderNode('provider1', 'Provider 1', dataProvider);
            const treeItem = await dataProvider.getTreeItem(providerNode);
            expect(treeItem.label).toBe('Provider 1');
            expect(treeItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
        });

        test('should return a tree item for a user provider tree node', async () => {
            const userNode = new UserProviderTreeNode(
                { id: 'root1', label: 'Root 1', hasChildren: true },
                'provider1',
                dataProvider
            );
            const treeItem = await dataProvider.getTreeItem(userNode);
            expect(treeItem.label).toBe('root1');
            expect(treeItem.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
        });
    });

    describe('dispose', () => {
        test('should dispose resources', () => {
            const disposeSpy = jest.spyOn(dataProvider['trash'], 'dispose');
            dataProvider.dispose();
            expect(disposeSpy).toHaveBeenCalled();
        });
    });
});



==================================


test('should extract errors and tracebacks correctly', async () => {
    const logContent = `
2025-04-01 13:15:19,829 (31756) vscode.control_channel INFO - Starting process
2025-04-01 13:15:19,829 (31756) vscode.control_channel ERROR - Unhandled exception processing message from extension: {'request': 'startUserTreeSession'}
    File "c:\\Users\\zkpbx1j\\Desktop\\quartz_vscode_extension\\python\\vscode\\control_channel.py", line 58, in onMessage
        res = handler(message)
    File "c:\\Users\\zkpbx1j\\Desktop\\quartz_vscode_extension\\python\\vscode\\qzshell_protocol.py", line 307, in on_startUserTreeSession
        _user_tree_service.load_providers()
ModuleNotFoundError: No module named 'example_user_tree'

2025-03-31 10:40:36,364 (9156) vscode.rpc_service.inform ERROR - Failed to process inform update: <qz.inform.client.writePartInformMessage object at 0x800000003384C880>
Traceback (most recent call last):
    File "c:\\example\\file.py", line 10, in <module>
        raise ValueError("Example exception")
ValueError: Example exception
    `;
    const logFiles = [{ name: 'test', ts: 1234, path: '/test/a' }];
    mockedInstances.spyOn(vscode.workspace.fs, 'readFile').mockResolvedValue(Buffer.from(logContent));

    const errorDetails = await logHelper.extractErrorDetails(logFiles);

    expect(errorDetails).toContain('ERROR - Unhandled exception processing message from extension');
    expect(errorDetails).toContain('ModuleNotFoundError: No module named \'example_user_tree\'');
    expect(errorDetails).toContain('Traceback (most recent call last):');
    expect(errorDetails).toContain('ValueError: Example exception');
});
