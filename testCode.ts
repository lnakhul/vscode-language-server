import { BaseTreeDataProvider, BaseTreeExplorerView } from './explorer';
import vscode from 'vscode';
import { shellApiClient } from './shellApiClient';

interface TreeViewRegistration {
    id: string;
    dataProvider: BaseTreeDataProvider;
    explorerView: BaseTreeExplorerView;
}

export interface ShellNodeData {
    id: string;
    label: string;
    hasChildren?: boolean;
    // ...additional fields that come back from your Shell API or DB
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

    /**
     * Fetches the *root* data from your backend.
     */
    public async fetchRootData(): Promise<ShellNodeData[]> {
        try {
            const response = await shellApiClient.get('/rootNodes');
            return response.data;
        } catch (error) {
            console.error('Error fetching root data:', error);
            throw error;
        }
    }

    /**
     * Fetches the *child* data for a given node ID.
     */
    public async fetchChildNodes(parentId: string): Promise<ShellNodeData[]> {
        try {
            const response = await shellApiClient.get(`/childNodes/${parentId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching child nodes for parent ID ${parentId}:`, error);
            throw error;
        }
    }
}

export const shellAPI = ShellAPI.getInstance();


====================


public registerAdditionalViewsAndCommands(context: vscode.ExtensionContext): void {
        // Register the bookmark explorer view
        const bookmarkExplorer = new BookmarkExplorer();
        this.registerTreeView('quartz.bookmarkExplorer', new BookmarksDataProvider(), bookmarkExplorer);

        // Register the shelves explorer view
        const shelvesExplorer = new ShelvesExplorer();
        this.registerTreeView('quartz.shelvesExplorer', new ShelfAreasDataProvider(), shelvesExplorer);

        // Register the switchTreeView command
        context.subscriptions.push(
            vscode.commands.registerCommand('quartz.switchTreeView', async () => {
                const registeredViews = this.getRegisteredViews();
                const items = registeredViews.map(view => ({ label: view.id }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select a tree view to switch to',
                });

                if (selected) {
                    const view = this.getTreeViewById(selected.label);
                    if (view) {
                        const rootNode = await view.dataProvider.getChildren();
                        if (rootNode.length > 0) {
                            await view.explorerView.reveal(rootNode[0]);
                        }
                    }
                }
            })
        );
    }


===============

    // genericTreeExplorer.ts (or data provider)
public *register(): Generator<vscode.Disposable> {
  yield vscode.commands.registerCommand('genericTree.createItem', async (node?: GenericTreeNode) => {
    if (!node) {
      vscode.window.showWarningMessage('Please select a node to create an item under.');
      return;
    }
    const label = await vscode.window.showInputBox({ prompt: 'Enter label for new item' });
    if (!label) return;

    await this.shell.executeUserCommand(node.providerId, 'createItem', {
      parentId: node.data.id,  // if you want to attach under the selected node
      label: label,
      type: 'Folder'
    });
    await this.refresh();
  });

  yield vscode.commands.registerCommand('genericTree.removeItem', async (node?: GenericTreeNode) => {
    if (!node) return;
    const yesno = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: `Remove item ${node.data.label}?`
    });
    if (yesno !== 'Yes') return;

    await this.shell.executeUserCommand(node.providerId, 'removeItem', {
      itemId: node.data.id,
      parentId: node.parent?.id  // if you have access to the parent's ID
    });
    await this.refresh();
  });

  yield vscode.commands.registerCommand('genericTree.editItem', async (node?: GenericTreeNode) => {
    if (!node) return;
    const newLabel = await vscode.window.showInputBox({
      prompt: `Rename item ${node.data.label} to:`
    });
    if (!newLabel) return;

    await this.shell.executeUserCommand(node.providerId, 'editItem', {
      itemId: node.data.id,
      newLabel
    });
    await this.refresh();
  });

  yield vscode.commands.registerCommand('genericTree.runSpecialLogic', async (node?: GenericTreeNode) => {
    if (!node) return;
    const result = await this.shell.executeUserCommand(node.providerId, 'runSpecialLogic', {});
    vscode.window.showInformationMessage(`Special logic result: ${JSON.stringify(result)}`);
  });
}



private async renameProviderCommand(nodeOrProvider?: ProviderNode) {
  // 1) If the user right-clicked on a provider node
  let providerId: string | undefined;
  let oldDisplayName: string | undefined;

  if (nodeOrProvider) {
    // The node is passed via context menu
    providerId = nodeOrProvider.providerId;
    oldDisplayName = nodeOrProvider.displayName;
  } else {
    // 2) Otherwise, invoked from palette, so fallback to quick pick
    const providers = await this.shell.listProviders();
    if (!providers.length) {
      vscode.window.showErrorMessage("No providers available to rename. Register a provider first.");
      return;
    }

    // Convert provider objects -> string array for your simpleCreateQuickPick
    const mapped = providers.map(p => ({
      displayString: p.displayName,
      actualId: p.id
    }));

    const pickedDisplayString = await simpleCreateQuickPick<string>({
      title: "Pick a provider to rename",
      choices: mapped.map(m => m.displayString),
      errorMessage: "Failed to select provider.",
      allowUserChoice: false,
      currentSelection: ""
    });
    if (!pickedDisplayString) return;

    const found = mapped.find(m => m.displayString === pickedDisplayString);
    if (!found) return;

    providerId = found.actualId;
    oldDisplayName = found.displayString;
  }

  if (!providerId) {
    vscode.window.showWarningMessage("No provider ID found to rename.");
    return;
  }

  // 3) Prompt for new name
  const newName = await vscode.window.showInputBox({
    prompt: `Rename provider '${oldDisplayName ?? providerId}'`,
    value: oldDisplayName ?? providerId
  });
  if (!newName) return; // user canceled

  // 4) Actually rename via shell
  try {
    await this.shell.updateProviderDisplayName(providerId, newName);
    await this.refresh();
    vscode.window.showInformationMessage(`Renamed provider '${oldDisplayName}' to '${newName}'`);
  } catch (error) {
    vscode.window.showErrorMessage(`Error renaming provider: ${String(error)}`);
  }
}

