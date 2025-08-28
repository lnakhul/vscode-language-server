// docstringRefs.ts  (or wherever you put the provider)
import * as vscode from 'vscode';
import { ProxyManager, ProxyProcessState } from './proxyManager';

// … keep your regexes and helper functions …

export class DocstringDefinitionProvider
  implements vscode.DefinitionProvider, vscode.DocumentLinkProvider, vscode.HoverProvider
{
  constructor(private proxy: ProxyManager) {}

  // Make the resolver callable by our command too
  public async resolveRef(document: vscode.TextDocument, ref: string): Promise<vscode.Location[] | undefined> {
    const local = await (async () => {
      if (PYTEST_NODEID.test(ref)) return (await resolvePytestNodeId(ref)) ?? undefined;
      if (DOTTED_REF.test(ref))   return (await resolveDotted(ref)) ?? undefined;
      return undefined;
    })();
    if (local?.length) return local;

    if (this.proxy.state === ProxyProcessState.Connected) {
      try {
        const payload = await this.proxy.rpc('nav.resolveSymbol', {
          filename: document.uri.fsPath,
          reference: ref,
          workspaceFolders: (vscode.workspace.workspaceFolders ?? []).map(f => f.uri.fsPath),
        });
        if (payload?.uri) {
          const uri = vscode.Uri.file(payload.uri);
          const pos = new vscode.Position(payload.line ?? 0, payload.character ?? 0);
          return [new vscode.Location(uri, pos)];
        }
      } catch { /* ignore */ }
    }
    return undefined;
  }

  async provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
    if (!(inTripleQuotedString(document, position) || inComment(document, position))) return;
    const rng = wordRangeAt(document, position);
    if (!rng) return;
    const ref = document.getText(rng);
    return this.resolveRef(document, ref);
  }

  provideDocumentLinks(document: vscode.TextDocument) {
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();
    const rx = new RegExp(`${PYTEST_NODEID.source}|${DOTTED_REF.source}`, 'g');
    for (const m of text.matchAll(rx)) {
      const start = document.positionAt(m.index ?? 0);
      const end   = document.positionAt((m.index ?? 0) + m[0].length);
      const middle = new vscode.Position(start.line, start.character + 1);
      if (!(inTripleQuotedString(document, middle) || inComment(document, middle))) continue;

      // Build command URI with args
      const args = {
        uri: document.uri.toString(),
        ref: m[0]
      };
      const target = vscode.Uri.parse(
        `command:quartz.openDocstringRef?${encodeURIComponent(JSON.stringify(args))}`
      );
      links.push(new vscode.DocumentLink(new vscode.Range(start, end), target));
    }
    return links;
  }

  async provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const rng = wordRangeAt(document, position);
    if (!rng || !(inTripleQuotedString(document, position) || inComment(document, position))) return;
    const ref = document.getText(rng);
    const args = encodeURIComponent(JSON.stringify({ uri: document.uri.toString(), ref }));
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown(`**Reference:** \`${ref}\`\n\n[Go to definition](command:quartz.openDocstringRef?${args})`);
    return new vscode.Hover(md, rng);
  }
}

// Export a single instance + command
export function registerDocstringRefProviders(context: vscode.ExtensionContext, proxy: ProxyManager) {
  const provider = new DocstringDefinitionProvider(proxy);
  const selector = { language: 'python', scheme: 'file' };

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, provider),
    vscode.languages.registerDocumentLinkProvider(selector, provider),
    vscode.languages.registerHoverProvider(selector, provider),

    vscode.commands.registerCommand('quartz.openDocstringRef', async (payload: { uri: string; ref: string }) => {
      try {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(payload.uri));
        const locs = await provider.resolveRef(doc, payload.ref);
        if (!locs || locs.length === 0) {
          vscode.window.showInformationMessage(`Can't resolve '${payload.ref}' from docstring/comment.`);
          return;
        }
        // Open the first match (VS Code will prompt if you prefer to offer multiple)
        const loc = locs[0];
        const ed = await vscode.window.showTextDocument(loc.uri);
        ed.revealRange(loc.range, vscode.TextEditorRevealType.InCenter);
        ed.selection = new vscode.Selection(loc.range.start, loc.range.start);
      } catch (e) {
        vscode.window.showWarningMessage(`Navigation failed for '${payload.ref}'.`);
      }
    })
  );
}
