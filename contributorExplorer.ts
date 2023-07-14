// Contribution interfaces
export interface Contributor {
  name: string;
  email: string;
  contributions: number;
}

export interface ContributorInfo extends CvsResponse {
  results: Contributor[];
}

// Create a Contributor class that extends AbstractTreeBaseNode
export class ContributorElement extends AbstracTreeBaseNode {
  private _treeItem: vscode.TreeItem;

  constructor(public contributor: Contributor, private icon: vscode.ThemeIcon) {
    super();

    // Create a tree item
    const treeItem = new vscode.TreeItem(contributor.name, vscode.TreeItemCollapsibleState.None);
    treeItem.id = contributor.email;
    treeItem.description = `Contributions: ${contributor.contributions}`;
    treeItem.iconPath = this.icon;

    treeItem.contextValue = 'quartzSCM.contributorNode';
    treeItem.tooltip = new vscode.MarkdownString(`**${contributor.name}** has made **${contributor.contributions}** contributions.`);

    this._treeItem = treeItem;
  }

  /**
   * Implements getTreeItem from Abstract Tree Base Node
   * @returns (vscode.TreeItem}
   */
  getTreeItem(): vscode.TreeItem {
    return this._treeItem;
  }
}

// Create a Contributor Data Provider class
export class ContributorDataProvider extends ScmDataProvider {
  constructor(private proxyManager: ProxyManager, sourceCache: Sourcecache, id: string) {
    super(sourceCache, id);
    this.trash.add(...this.register());
  }

  /**
   * Register disposables
   */
  *register(): Generator<vscode.Disposable> {
    yield vscode.commands.registerCommand('quartz.refreshContributorData', this.refresh, this);
  }

  /**
   * Update children.
   */
  async updateChildren(path: string|undefined, report: (message: string) => void): Promise<void> {
    if (!path) return;
    const contributorResults = await this.proxyManager.sendRequest<ContributorInfo>(null, 'cvs:contributors', path);
    if (this.path !== path) return;

    // Create elements
    const children: ContributorElement[] = [];

    for (const contributor of contributorResults.results) {
      children.push(new ContributorElement(contributor, new vscode.ThemeIcon('person')));
    }

    this.setChildren(children);
  }
}
------------------------------------------------

// Contributor information
export interface ContributorInfo {
    username: string;
    contributions: number;
    avatarUrl: string;
    profileUrl: string;
}

// Contributor tree item
export class ContributorTreeItem extends vscode.TreeItem {
    constructor(public readonly contributorInfo: ContributorInfo) {
        super(contributorInfo.username, vscode.TreeItemCollapsibleState.None);
        
        this.description = `Contributions: ${contributorInfo.contributions}`;
        this.tooltip = `${this.contributorInfo.username} - Click to open profile.`;
        this.iconPath = vscode.Uri.parse(contributorInfo.avatarUrl);
        this.command = {
            command: 'extension.openContributorProfile', 
            title: 'Open Contributor Profile', 
            arguments: [contributorInfo.profileUrl]
        };
    }
}

// Contributor data provider
export class ContributorDataProvider implements vscode.TreeDataProvider<ContributorTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ContributorTreeItem | undefined> = new vscode.EventEmitter<ContributorTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ContributorTreeItem | undefined> = this._onDidChangeTreeData.event;
    
    constructor(private proxyManager: ProxyManager) {
        // register command for opening contributor profile
        vscode.commands.registerCommand('extension.openContributorProfile', (profileUrl: string) => {
            vscode.env.openExternal(vscode.Uri.parse(profileUrl));
        });
    }
    
    // Fetch contributors
    getTreeItem(element: ContributorTreeItem): vscode.TreeItem {
        return element;
    }
    
    async getChildren(): Promise<ContributorTreeItem[]> {
        const contributorInfos: ContributorInfo[] = await this.proxyManager.sendRequest<ContributorInfo[]>(null, 'get:contributors');
        return contributorInfos.map(info => new ContributorTreeItem(info));
    }
    
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}

------------------------------------
  import * as vscode from 'vscode';
import * as cp from 'child_process';

export function activate(context: vscode.ExtensionContext) {

  // Tree data provider
  const provider = new ContributorsTreeDataProvider();
  vscode.window.registerTreeDataProvider('contributorsView', provider);

  // Refresh command
  const refreshCommand = vscode.commands.registerCommand('extension.refreshContributors', () => provider.refresh());
  context.subscriptions.push(refreshCommand);
}

class ContributorsTreeDataProvider implements vscode.TreeDataProvider<Contributor> {

  private _onDidChangeTreeData: vscode.EventEmitter<Contributor | undefined | null | void> = new vscode.EventEmitter<Contributor | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Contributor | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Contributor): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Contributor): Thenable<Contributor[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      return this.getContributors();
    }
  }

  private getContributors(): Thenable<Contributor[]> {
    return new Promise((resolve, reject) => {
      cp.exec('git shortlog -sne --all', (err, stdout) => {
        if (err) {
          reject(err);
        } else {
          const lines = stdout.trim().split('\n');
          const contributors = lines.map(line => {
            const match = line.match(/^(\d+)\s+(.*)\s<(.*)>$/);
            if (match) {
              const [_, count, name, email] = match;
              return new Contributor(name, Number(count), vscode.TreeItemCollapsibleState.None);
            } else {
              return undefined;
            }
          }).filter(Boolean) as Contributor[];
          resolve(contributors);
        }
      });
    });
  }
}

class Contributor extends vscode.TreeItem {

  constructor(
    public readonly label: string,
    private count: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.description = `${count} commit${count === 1 ? '' : 's'}`;
  }

  iconPath = new vscode.ThemeIcon('account');
}

export class ContributorExplorer extends BaseTreeExplorerView implements vscode.Disposable {
  private _disposable: vscode.Disposable;
  private _dataProvider: ContributorsTreeDataProvider;

  constructor() {
    super();

    // Set up a new data provider.
    this._dataProvider = new ContributorsTreeDataProvider();

    // Register the TreeDataProvider for our view.
    vscode.window.registerTreeDataProvider('contributorsView', this._dataProvider);

    // Refresh command
    const refreshCommand = vscode.commands.registerCommand('extension.refreshContributors', () => this._dataProvider.refresh());

    // It is important to push the command into the extension context, otherwise it will be disposed of too early.
    this._disposable = vscode.Disposable.from(refreshCommand);
  }

  getTreeItem(element: Contributor): vscode.TreeItem {
    return this._dataProvider.getTreeItem(element);
  }

  getChildren(element?: Contributor): Thenable<Contributor[]> {
    return this._dataProvider.getChildren(element);
  }

  dispose() {
    // This will ensure that we clean up our command when the extension is deactivated.
    this._disposable.dispose();
  }
}








