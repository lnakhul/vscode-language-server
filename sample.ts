Kid// quartzShell.ts
import { ProxyManager } from './proxyManager'; // or wherever

export interface GenericTreeItemData {
    id: string;
    label: string;
    hasChildren?: boolean;
    path?: string;
}

export class QuartzShell {
    constructor(private proxy: ProxyManager) {}

    /**
     * Register a new provider
     */
    public async registerTreeProvider(providerId: string, config: object): Promise<boolean> {
        return await this.proxy.sendRequest<boolean>(
            'generic:registerTreeProvider', 
            { provider_id: providerId, config }
        );
    }

    /**
     * List existing providers
     */
    public async listProviders(): Promise<string[]> {
        return this.proxy.sendRequest<string[]>('generic:listProviders', null) || [];
    }

    /**
     * getRootItems(providerId)
     */
    public async getRootItems(providerId: string): Promise<GenericTreeItemData[]> {
        return (await this.proxy.sendRequest<GenericTreeItemData[]>(


            'generic:getRootItems', 
            providerId
        )) || [];
    }

    /**
     * getChildItems(providerId, parentId)
     * We might pass a single object or multiple fields. 
     * Here, we just pass { provider_id, parent_id } for clarity.
     */
    public async getChildItems(providerId: string, parentId: string): Promise<GenericTreeItemData[]> {
        return (await this.proxy.sendRequest<GenericTreeItemData[]>(
            'generic:getChildItems', 
            { provider_id: providerId, parent_id: parentId }
        )) || [];
    }

    /**
     * Execute a user command on the Python side
     */
    public async executeUserCommand(providerId: string, commandName: string, args: object): Promise<any> {
        return this.proxy.sendRequest<any>(
            'generic:executeUserCommand',
            { provider_id: providerId, command_name: commandName, args }
        );
    }
}




=#===========

// genericTreeExplorer.ts

import * as vscode from 'vscode';
import { AbstractTreeBaseNode, BaseTreeDataProvider, BaseTreeExplorerView, ExplorerTreeBaseNode } from './explorer'; 
import { QuartzShell, GenericTreeItemData } from './quartzShell';

export class ProviderNode extends AbstractTreeBaseNode {
    // This node represents a provider as the top-level item
    constructor(public readonly providerId: string, private shell: QuartzShell) {
        super();
        this.id = `provider::${providerId}`;
    }

    async getTreeItem(): Promise<vscode.TreeItem> {
        // Collapsed by default
        const item = new vscode.TreeItem(this.providerId, vscode.TreeItemCollapsibleState.Collapsed);
        item.contextValue = 'genericTreeProvider';
        item.tooltip = `Provider: ${this.providerId}`;
        return item;
    }

    async getChildren(): Promise<ExplorerTreeBaseNode[]> {
        // Fetch the root items for this provider
        const rootItems = await this.shell.getRootItems(this.providerId);
        return rootItems.map((ri) => new GenericTreeNode(ri, this.providerId, this.shell, this));
    }
}

export class GenericTreeNode extends AbstractTreeBaseNode {
    private _children: ExplorerTreeBaseNode[] | null = null;

    constructor(
        public readonly data: GenericTreeItemData,
        public readonly providerId: string,
        private shell: QuartzShell,
        parent?: ExplorerTreeBaseNode
    ) {
        super(parent);
        // Use the data's ID as the stable ID so expansion state is preserved
        this.id = data.id;
    }

    async getTreeItem(): Promise<vscode.TreeItem> {
        const collapsible = this.data.hasChildren
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;

        const item = new vscode.TreeItem(this.data.label, collapsible);
        item.contextValue = 'genericTreeItem';
        // You could add custom icons or commands here if desired
        item.tooltip = this.data.path ? `Path: ${this.data.path}` : `ID: ${this.data.id}`;
        return item;
    }

    async getChildren(): Promise<ExplorerTreeBaseNode[]> {
        if (!this.data.hasChildren) {
            return [];
        }

        if (this._children) {
            return this._children;
        }

        // fetch from Python
        const childItems = await this.shell.getChildItems(this.providerId, this.data.id);
        this._children = childItems.map(
            (ci) => new GenericTreeNode(ci, this.providerId, this.shell, this)
        );
        return this._children;
    }
}

class LoadingNode extends AbstractTreeBaseNode {
    async getTreeItem(): Promise<vscode.TreeItem> {
        return new vscode.TreeItem('Loading...', vscode.TreeItemCollapsibleState.None);
    }
}

export class GenericTreeDataProvider extends BaseTreeDataProvider {
    private _rootNodes: ExplorerTreeBaseNode[] = [];
    private _busy = false;
    private _lastError: Error | null = null;
    private _onDidChangeTreeData = new vscode.EventEmitter<ExplorerTreeBaseNode | undefined>();
    public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private shell: QuartzShell) {
        super();
        this.refresh(); // load providers at once
    }

    async getChildren(element?: ExplorerTreeBaseNode): Promise<ExplorerTreeBaseNode[]> {
        if (element) {
            return element.getChildren();
        }

        if (this._lastError) {
            return [];
        }
        if (this._busy) {
            return [new LoadingNode()];
        }
        // Return the list of providers as the "root" items
        return this._rootNodes;
    }

    async refresh(): Promise<void> {
        try {
            this._busy = true;
            this._lastError = null;
            this._rootNodes = [];

            const providers = await this.shell.listProviders();
            // Each provider is a top-level node
            this._rootNodes = providers.map(pid => new ProviderNode(pid, this.shell));
        } catch (err: any) {
            this._lastError = err;
            console.error('Error refreshing Generic Tree:', err);
            vscode.window.showErrorMessage(`Failed to refresh Generic Tree: ${err.message}`);
        } finally {
            this._busy = false;
            this._onDidChangeTreeData.fire(undefined);
        }
    }

    dispose() {
        this._rootNodes.forEach(n => n.dispose());
    }
}

export class GenericTreeExplorerView extends BaseTreeExplorerView {
    protected treeDataProvider: GenericTreeDataProvider;

    constructor(private shell: QuartzShell) {
        super();
        this.treeDataProvider = new GenericTreeDataProvider(shell);
        this.newTreeView(); // create actual vscode.TreeView
    }

    viewId(): string {
        return 'quartz.genericTreeView'; // must match package.json
    }

    async refreshTree(): Promise<void> {
        await this.treeDataProvider.refresh();
    }

    async registerProvider(providerId: string, config: object): Promise<void> {
        // Register a new provider in Python
        const success = await this.shell.registerTreeProvider(providerId, config);
        if (!success) {
            vscode.window.showErrorMessage(`Provider ${providerId} was not registered`);
        } else {
            // Then refresh to see it in the tree
            await this.refreshTree();
        }
    }
}

=================
// extension.ts

import * as vscode from 'vscode';
import { QuartzShell } from './quartzShell';
import { GenericTreeExplorerView } from './genericTreeExplorer';
import { MyProxyManager } from './proxyManager';

export function activate(context: vscode.ExtensionContext) {
    // 1) Create your proxy manager
    const proxy = new MyProxyManager();
    // 2) Create your shell
    const shell = new QuartzShell(proxy);
    // 3) Create the tree
    const genericView = new GenericTreeExplorerView(shell);

    // 4) Register a command to refresh
    context.subscriptions.push(
        vscode.commands.registerCommand('quartz.genericTree.refresh', async () => {
            await genericView.refreshTree();
        })
    );

    // 5) Register a command to add a new provider
    context.subscriptions.push(
        vscode.commands.registerCommand('quartz.genericTree.registerProvider', async () => {
            const providerId = await vscode.window.showInputBox({
                prompt: 'Enter provider ID'
            });
            if (!providerId) return;

            // For demonstration, pass a trivial config
            const config = { label: `Provider ${providerId}`, something: 'foo' };
            await genericView.registerProvider(providerId, config);
        })
    );

    // 6) Example command to execute a user command on a node
    context.subscriptions.push(
        vscode.commands.registerCommand('quartz.genericTree.executeUserCommand', async (node) => {
            // 'node' might be a GenericTreeNode with providerId + data
            if (!node || !node.data) {
                return;
            }
            const result = await shell.executeUserCommand(node.providerId, 'addChild', {
                parentId: node.data.id,
                label: 'NewKid'
            });
            vscode.window.showInformationMessage(JSON.stringify(result));
            // Then refresh
            await genericView.refreshTree();
        })
    );
}

export function deactivate() {}


========

{
  "contributes": {
    "views": {
      "explorer": [
        {
          "id": "quartz.genericTreeView",
          "name": "Generic Tree"
        }
      ]
    },
    "commands": [
      {
        "command": "quartz.genericTree.refresh",
        "title": "Refresh Generic Tree"
      },
      {
        "command": "quartz.genericTree.registerProvider",
        "title": "Register a New Provider"
      },
      {
        "command": "quartz.genericTree.executeUserCommand",
        "title": "Execute a User Command on Node"
      }
    ],
    "menus": {
      "view/item/context": [
        {
          "command": "quartz.genericTree.executeUserCommand",
          "when": "viewItem == genericTreeItem",
          "group": "inline"
        }
      ]
    }
  }
}


========================private resolveKeybindingsPath(): vscode.Uri {
    // 1) Portable DevTools: sibling of resources/app
    const appRoot = vscode.env.appRoot; 
    const portableKey = path.resolve(appRoot, '..', '..', 'data', 'user-data', 'User', 'keybindings.json');
    if (fs.existsSync(portableKey)) {
      return vscode.Uri.file(portableKey);
    }

    // 2) Standard Windows install under %APPDATA%\Code\User
    const appData = process.env['APPDATA'] || path.join(os.homedir(), 'AppData', 'Roaming');
    const normalKey = path.join(appData, 'Code', 'User', 'keybindings.json');
    return vscode.Uri.file(normalKey);
  }
