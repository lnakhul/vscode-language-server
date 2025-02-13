import * as vscode from 'vscode';
import { AbstractTreeBaseNode, BaseTreeDataProvider, BaseTreeExplorerView, ExplorerTreeBaseNode } from './explorer';
import { Trash } from '/utils'; 

// Import the functions + interface from shellApi.ts
import { fetchRootData, fetchChildNodes, ShellNodeData } from './shellApi';

interface GenericNodeData {
    id: string;
    label: string;
    hasChildren?: boolean;
    // ...additional fields if needed
}

/**
 * GenericTreeNode
 * ---------------
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
        // Give this node a unique ID:
        this.id = data.id || parent?.id || 'GenericTreeNode';
    }

    async getTreeItem(): Promise<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(
            this._data.label,
            this._data.hasChildren
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );
        treeItem.contextValue = 'genericTreeNode';
        treeItem.tooltip = `ID: ${this._data.id}`;
        return treeItem;
    }

    async getChildren(): Promise<ExplorerTreeBaseNode[]> {
        if (!this._data.hasChildren) {
            return [];
        }

        // If we have already fetched children, return them
        if (this._children) {
            return this._children;
        }

        try {
            // Call your real Shell API to fetch child data
            const shellApiData: ShellNodeData[] = await fetchChildNodes(this._data.id);

            // Convert to our GenericNodeData type if needed.
            // If ShellNodeData is the same shape, you can cast or rename:
            const childNodes: GenericNodeData[] = shellApiData.map(data => ({
                id: data.id,
                label: data.label,
                hasChildren: data.hasChildren
            }));

            // Build GenericTreeNodes from the results
            this._children = childNodes.map(childData => new GenericTreeNode(childData, this));
            return this._children;
        } catch (error) {
            console.error('Error fetching child nodes:', error);
            vscode.window.showErrorMessage(`Could not load children for ${this._data.label}`);
            return [];
        }
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
 * GenericTreeDataProvider
 * -----------------------
 */
export class GenericTreeDataProvider extends BaseTreeDataProvider {
    private _rootNodes: ExplorerTreeBaseNode[] = [];
    private _onDidChangeTreeData = new vscode.EventEmitter<ExplorerTreeBaseNode | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private _busy = false;
    private _lastError: Error | null = null;

    constructor() {
        super();
        this.refresh(); // Optionally fetch data on init
    }

    async getChildren(element?: ExplorerTreeBaseNode): Promise<ExplorerTreeBaseNode[]> {
        if (element) {
            return element.getChildren();
        }

        if (this._lastError) {
            // Optionally return a special Error node
            return [];
        }

        if (this._busy) {
            // Show a "Loading" placeholder node
            return [new GenericLoadingNode()];
        }

        // Return top-level nodes
        return this._rootNodes;
    }

    async refresh(): Promise<void> {
        try {
            this._busy = true;
            this._lastError = null;
            this._rootNodes = [];

            // Fetch top-level data from your Shell API
            const topLevelData: ShellNodeData[] = await fetchRootData();

            // Transform them to our GenericNodeData
            const nodeDataArray: GenericNodeData[] = topLevelData.map(data => ({
                id: data.id,
                label: data.label,
                hasChildren: data.hasChildren
            }));

            // Create GenericTreeNode objects
            this._rootNodes = nodeDataArray.map(data => new GenericTreeNode(data));

        } catch (error: any) {
            this._lastError = error;
            console.error('Error fetching top-level data:', error);
            vscode.window.showErrorMessage(`Failed to refresh Generic Tree: ${error.message}`);
        } finally {
            this._busy = false;
            this._onDidChangeTreeData.fire(undefined); // Trigger a UI refresh
        }
    }

    dispose() {
        this._rootNodes.forEach(node => node.dispose());
    }
}

/**
 * GenericTreeExplorerView
 * -----------------------
 */
export class GenericTreeExplorerView extends BaseTreeExplorerView {
    protected treeDataProvider: GenericTreeDataProvider;

    constructor() {
        super();
        this.treeDataProvider = new GenericTreeDataProvider();
        this.newTreeView(); // Creates the actual vscode.TreeView
    }

    viewId(): string {
        return 'myExtension.genericTreeView';
    }

    async refreshTree(): Promise<void> {
        await this.treeDataProvider.refresh();
    }

    // Optional QuickPick logic to switch data sources, etc.
    async pickDataSource(): Promise<void> {
        const picks = [
            { label: 'Data Source A', description: 'Load data set A' },
            { label: 'Data Source B', description: 'Load data set B' },
        ];

        const choice = await vscode.window.showQuickPick(picks, {
            placeHolder: 'Pick your desired data source',
        });
        if (!choice) return;

        vscode.window.showInformationMessage(`Loading from ${choice.label}...`);
        // Potentially pass that choice to the data provider...
        // e.g. this.treeDataProvider.setDataSource(choice.label);
        await this.treeDataProvider.refresh();
    }
}
