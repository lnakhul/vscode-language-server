import { BaseTreeDataProvider, BaseTreeExplorerView } from './explorer';
import vscode from 'vscode';

interface TreeViewRegistration {
    id: string;
    dataProvider: BaseTreeDataProvider;
    explorerView: BaseTreeExplorerView;
}

class ShellAPI {
    private static instance: ShellAPI;
    private registeredViews: Map<string, TreeViewRegistration> = new Map();

    private constructor() {}

    public static getInstance(): ShellAPI {
        if (!ShellAPI.instance) {
            ShellAPI.instance = new ShellAPI();
        }
        return ShellAPI.instance;
    }

    public registerTreeView(id: string, dataProvider: BaseTreeDataProvider, explorerView: BaseTreeExplorerView): void {
        if (this.registeredViews.has(id)) {
            throw new Error(`TreeView with id ${id} is already registered.`);
        }
        this.registeredViews.set(id, { id, dataProvider, explorerView });
    }

    public getRegisteredViews(): TreeViewRegistration[] {
        return Array.from(this.registeredViews.values());
    }

    public getTreeViewById(id: string): TreeViewRegistration | undefined {
        return this.registeredViews.get(id);
    }
}

export const shellAPI = ShellAPI.getInstance();
