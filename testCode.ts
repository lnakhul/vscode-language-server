import * as vscode from 'vscode';
import { AbstractTreeBaseNode, ExplorerTreeBaseNode } from './explorer'; // Adjust import path
import { Trash } from '/utils'; // Your existing utility

interface GenericNodeData {
    id: string;
    label: string;
    hasChildren?: boolean;
    // ...additional fields that come back from your Shell API or DB
}

/**
 * GenericTreeNode
 * --------------
 * Represents one node in our Generic Tree. Each node is constructed
 * from the data we get back from the Shell API. If hasChildren === true,
 * then getChildren() will call the Shell API to fetch child nodes.
 */
export class GenericTreeNode extends AbstractTreeBaseNode {
    private _data: GenericNodeData;
    private _children: ExplorerTreeBaseNode[] | null = null; // null indicates "not yet fetched"

    constructor(data: GenericNodeData, parent?: ExplorerTreeBaseNode) {
        super(parent);
        this._data = data;

        // Give this node a unique ID (the parent's ID plus our own, if desired):
        this.id = data.id || parent?.id || 'GenericTreeNode';
    }

    /**
     * getTreeItem
     * -----------
     * Return the VSCode TreeItem for this node. 
     * This can be async or sync.
     */
    async getTreeItem(): Promise<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(
            this._data.label,
            this._data.hasChildren
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );

        // Optionally set contextValue for custom commands in package.json
        treeItem.contextValue = 'genericTreeNode';
        treeItem.tooltip = `ID: ${this._data.id}`;

        return treeItem;
    }

    /**
     * getChildren
     * -----------
     * Called by VS Code to expand this node and retrieve children.
     * If `hasChildren` is true, we fetch them. Otherwise, return empty array.
     */
    async getChildren(): Promise<ExplorerTreeBaseNode[]> {
        if (!this._data.hasChildren) {
            return [];
        }

        // If we have already fetched children, return them
        if (this._children) {
            return this._children;
        }

        try {
            // STUB: Example call out to your Shell API / database / proxy
            const shellApiData: GenericNodeData[] = await fakeShellApiFetchChildren(this._data.id);

            // Map each child’s data into a GenericTreeNode
            this._children = shellApiData.map(
                (childData) => new GenericTreeNode(childData, this /* parent */)
            );

            return this._children;
        } catch (error) {
            // Gracefully handle errors:
            console.error('Error fetching child nodes:', error);
            vscode.window.showErrorMessage(`Could not load children for ${this._data.label}`);
            // Return empty so the tree can still render
            return [];
        }
    }
}

/**
 * Stub method to simulate a backend call to fetch child nodes.
 * Replace this with your actual Sandra / Shell API call.
 */
async function fakeShellApiFetchChildren(parentId: string): Promise<GenericNodeData[]> {
    // In production, you'd do something like:
    // return shellApi.getChildNodes(parentId);

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: `${parentId}-child-1`, label: `Child 1 of ${parentId}`, hasChildren: false },
                { id: `${parentId}-child-2`, label: `Child 2 of ${parentId}`, hasChildren: true },
            ]);
        }, 500);
    });
}


================================

import { BaseTreeDataProvider, ExplorerTreeBaseNode } from './explorer'; // Adjust import path
import * as vscode from 'vscode';
import { GenericTreeNode } from './GenericTreeNode'; // Adjust import path

/**
 * GenericTreeDataProvider
 * -----------------------
 * Provides data to the Generic Tree. 
 * - Manages top-level nodes
 * - Re-fetches data on refresh
 * - Integrates with Shell API
 */
export class GenericTreeDataProvider extends BaseTreeDataProvider {
    private _rootNodes: ExplorerTreeBaseNode[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<ExplorerTreeBaseNode | undefined> = 
        new vscode.EventEmitter<ExplorerTreeBaseNode | undefined>();

    readonly onDidChangeTreeData: vscode.Event<ExplorerTreeBaseNode | undefined> = 
        this._onDidChangeTreeData.event;

    private _busy = false;
    private _lastError: Error | null = null;

    constructor() {
        super();
        // Optionally load initial data right away:
        this.refresh();
    }

    /**
     * getChildren
     * -----------
     * Returns children of a given node. If no node is passed, returns top-level nodes.
     */
    async getChildren(element?: ExplorerTreeBaseNode): Promise<ExplorerTreeBaseNode[]> {
        if (element) {
            // Defer to the node’s getChildren
            return element.getChildren();
        }

        // This is the top-level call
        // If we had an error previously, show an error node or empty
        if (this._lastError) {
            // Optionally we can create a special "error node", or just return empty
            return [];
        }

        // If the data is still being fetched, you could return a "Loading" node
        if (this._busy) {
            // Alternatively, return an empty array for now
            return [new GenericLoadingNode()];
        }

        // Otherwise, return the main root nodes
        return this._rootNodes;
    }

    /**
     * refresh
     * -------
     * Public method to re-fetch data from the backend and update the tree.
     */
    async refresh(): Promise<void> {
        try {
            this._busy = true;
            this._lastError = null;
            this._rootNodes = [];

            // Example: fetch from Shell API
            const topLevelData = await fakeShellApiFetchRoot();

            // Convert each piece of data into a GenericTreeNode
            this._rootNodes = topLevelData.map(
                (nodeData) => new GenericTreeNode(nodeData)
            );

        } catch (error: any) {
            this._lastError = error;
            console.error('Error fetching top-level data for tree:', error);
            vscode.window.showErrorMessage(`Failed to refresh Generic Tree: ${error.message}`);
        } finally {
            this._busy = false;
            // Force the tree to update
            this._onDidChangeTreeData.fire(undefined);
        }
    }

    /**
     * dispose
     * -------
     * Clean up disposables. 
     */
    dispose() {
        // If any nodes hold onto disposables, you can call dispose on them.
        this._rootNodes.forEach(node => node.dispose());
    }
}

/**
 * Minimal Node to represent "Loading..." in the tree.
 */
class GenericLoadingNode extends GenericTreeNode {
    constructor() {
        super({ id: 'loading', label: 'Loading...', hasChildren: false });
    }

    async getChildren(): Promise<ExplorerTreeBaseNode[]> {
        return [];
    }
}

/**
 * Stub method simulating a top-level fetch from your Shell API.
 */
async function fakeShellApiFetchRoot(): Promise<{id: string; label: string; hasChildren: boolean}[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { id: 'root-1', label: 'Root 1', hasChildren: true },
                { id: 'root-2', label: 'Root 2', hasChildren: false },
            ]);
        }, 300);
    });
}


=====================

import * as vscode from 'vscode';
import { BaseTreeExplorerView } from './explorer'; // Adjust import path
import { GenericTreeDataProvider } from './GenericTreeDataProvider'; // Adjust import path

/**
 * GenericTreeExplorerView
 * -----------------------
 * Manages registration of the TreeDataProvider with VS Code 
 * and any additional functionality like QuickPick selections 
 * or shell commands that alter the tree.
 */
export class GenericTreeExplorerView extends BaseTreeExplorerView {
    protected treeDataProvider: GenericTreeDataProvider;

    constructor() {
        super();
        this.treeDataProvider = new GenericTreeDataProvider();
        // Create the treeView
        this.newTreeView();
    }

    /**
     * The unique ID for this view, as referenced in package.json contributes.views
     */
    viewId(): string {
        return 'myExtension.genericTreeView';
    }

    /**
     * Refresh the entire tree by telling our data provider to re-fetch data.
     */
    async refreshTree(): Promise<void> {
        await this.treeDataProvider.refresh();
    }

    /**
     * Example method that uses a QuickPick to decide which “mode” or “data set” 
     * to load in the tree. This is optional, but shows how you might 
     * integrate a user-facing QuickPick to pivot the tree’s data.
     */
    async pickDataSource(): Promise<void> {
        const picks = [
            { label: 'Data Source A', description: 'Load data set A' },
            { label: 'Data Source B', description: 'Load data set B' },
        ];

        const choice = await vscode.window.showQuickPick(picks, {
            placeHolder: 'Pick your desired data source',
        });
        if (!choice) {
            return; // user cancelled
        }

        try {
            // In a real extension, you'd do something with the choice 
            // (e.g., call a different endpoint, set a flag, etc.).
            // For demonstration:
            vscode.window.showInformationMessage(`Loading from ${choice.label}...`);

            // Possibly pass that choice to the data provider
            // e.g. this.treeDataProvider.setDataSource(choice.label);
            // Then refresh:
            await this.treeDataProvider.refresh();
        } catch (error) {
            console.error('Error picking data source:', error);
            vscode.window.showErrorMessage('Failed to load the selected data source.');
        }
    }
}
