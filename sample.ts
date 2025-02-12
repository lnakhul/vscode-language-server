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


==========================

import { shellAPI } from './shellApi';
import vscode from 'vscode';
import { Trash } from '/utils';

// ...existing code...

export class GenericTreeView extends BaseTreeExplorerView {
    constructor(private viewId: string, private dataProvider: BaseTreeDataProvider) {
        super();
        this.treeDataProvider = dataProvider;
        this.newTreeView();
    }

    viewId(): string {
        return this.viewId;
    }

    refresh(): void {
        this.treeDataProvider.refresh();
    }

    dispose(): void {
        super.dispose();
    }
}

// Register the generic tree view with the Shell API
export function registerGenericTreeView(viewId: string, dataProvider: BaseTreeDataProvider): void {
    const explorerView = new GenericTreeView(viewId, dataProvider);
    shellAPI.registerTreeView(viewId, dataProvider, explorerView);
}

================================

import { shellAPI } from './shellApi';
import vscode from 'vscode';

export async function switchTreeView(): Promise<void> {
    const registeredViews = shellAPI.getRegisteredViews();
    const items = registeredViews.map(view => ({ label: view.id }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a tree view to switch to',
    });

    if (selected) {
        const view = shellAPI.getTreeViewById(selected.label);
        if (view) {
            await view.explorerView.reveal(view.dataProvider.getTreeItem());
        }
    }
}

// Register the command in your extension's activation function
export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.switchTreeView', switchTreeView)
    );
}


=======================================


{
    "contributes": {
        "commands": [
            {
                "command": "extension.switchTreeView",
                "title": "Switch Tree View"
            }
        ]
    }
}


==================

import { registerGenericTreeView } from './explorer';
import { activate as activateCommands } from './commands';
import { MyTreeDataProvider } from './myTreeDataProvider'; // Example data provider

export function activate(context: vscode.ExtensionContext): void {
    activateCommands(context);

    // Register example tree views
    const dbExplorerDataProvider = new MyTreeDataProvider();
    registerGenericTreeView('dbExplorer', dbExplorerDataProvider);

    // Register other tree views similarly
}
