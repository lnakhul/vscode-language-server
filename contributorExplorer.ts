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
