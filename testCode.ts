// src/docstringRefs.ts
import * as vscode from 'vscode';
import { ProxyManager, ProxyProcessState } from '/proxyManager';

const DOTTED_REF = /[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+/;           // e.g., pkg.mod.Class / pkg.mod.func
const PYTEST_NODEID = /(?:(?:[^:\s]+\.py)|(?:[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+))(?:::[A-Za-z_]\w+)*(?:::[A-Za-z_]\w+)?/;

const TRIPLE_STR = /("""|''')[\s\S]*?\1/g;                      // docstring blocks
const LINE_COMMENT = /^\s*#/;                                   // quick check

function inTripleQuotedString(document: vscode.TextDocument, pos: vscode.Position): boolean {
  const text = document.getText();
  const offset = document.offsetAt(pos);
  for (const m of text.matchAll(TRIPLE_STR)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (offset >= start && offset <= end) return true;
  }
  return false;
}
function inComment(document: vscode.TextDocument, pos: vscode.Position): boolean {
  const line = document.lineAt(pos.line).text;
  return LINE_COMMENT.test(line);
}

function wordRangeAt(document: vscode.TextDocument, position: vscode.Position): vscode.Range | undefined {
  const rx = new RegExp(`(${PYTEST_NODEID.source})|(${DOTTED_REF.source})`, 'g');
  const line = document.lineAt(position.line).text;
  let match: RegExpExecArray | null;
  while ((match = rx.exec(line))) {
    const start = match.index!;
    const end = start + match[0].length;
    if (position.character >= start && position.character <= end) {
      return new vscode.Range(new vscode.Position(position.line, start), new vscode.Position(position.line, end));
    }
  }
  return document.getWordRangeAtPosition(position, rx);
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try { await vscode.workspace.fs.stat(uri); return true; } catch { return false; }
}

async function resolveDottedModuleToUris(modPath: string): Promise<vscode.Uri[]> {
  // Try common roots: workspace, src/, tests/
  const out: vscode.Uri[] = [];
  const pieces = modPath.split('.');
  const fileCandidate = pieces.join('/') + '.py';
  const initCandidate = pieces.join('/') + '/__init__.py';
  const folders = vscode.workspace.workspaceFolders ?? [];
  for (const f of folders) {
    for (const rel of [fileCandidate, initCandidate, `src/${fileCandidate}`, `src/${initCandidate}`, `tests/${fileCandidate}`]) {
      const uri = vscode.Uri.joinPath(f.uri, rel);
      if (await fileExists(uri)) out.push(uri);
    }
  }
  return Array.from(new Set(out.map(u => u.toString()))).map(s => vscode.Uri.parse(s));
}

async function findSymbolLine(doc: vscode.TextDocument, symbolName: string): Promise<vscode.Position | undefined> {
  const rx = new RegExp(`^(\\s*)(class|def)\\s+${symbolName}\\b`);
  for (let i = 0; i < doc.lineCount; i++) {
    if (rx.test(doc.lineAt(i).text)) return new vscode.Position(i, 0);
  }
  return undefined;
}

function splitDotted(ref: string): { module: string; symbol?: string } {
  // pkg.mod.Class -> {module: pkg.mod, symbol: Class}
  const parts = ref.split('.');
  if (parts.length <= 1) return { module: ref };
  const symbol = parts[parts.length - 1];
  const module = parts.slice(0, -1).join('.');
  return { module, symbol };
}

function parsePytestNodeId(ref: string): { pyPathOrDotted: string; trail: string[] } {
  const bits = ref.split('::');
  return { pyPathOrDotted: bits[0], trail: bits.slice(1) };
}

async function resolvePytestNodeId(ref: string): Promise<vscode.Location[] | undefined> {
  const { pyPathOrDotted, trail } = parsePytestNodeId(ref);

  // path-like?
  if (pyPathOrDotted.endsWith('.py')) {
    const matches = await vscode.workspace.findFiles(`**/${pyPathOrDotted.replace(/^\.?\/?/, '')}`);
    if (matches.length === 0) return undefined;
    const uri = matches[0];
    const doc = await vscode.workspace.openTextDocument(uri);
    // Drill into ::Class::test_method if present
    let pos: vscode.Position | undefined;
    for (const name of trail) {
      pos = await findSymbolLine(doc, name) ?? pos;
    }
    const range = new vscode.Range(pos ?? new vscode.Position(0, 0), pos ?? new vscode.Position(0, 0));
    return [new vscode.Location(uri, range)];
  }

  // dotted tests.test_mod.Class.test_fn
  const { module, symbol } = splitDotted(pyPathOrDotted);
  const uris = await resolveDottedModuleToUris(module);
  if (uris.length === 0) return undefined;
  const uri = uris[0];
  const doc = await vscode.workspace.openTextDocument(uri);

  // Use last element in dotted path if not provided via ::trail
  const targets = [...trail, symbol].filter(Boolean) as string[];
  let pos: vscode.Position | undefined;
  for (const name of targets) {
    pos = await findSymbolLine(doc, name) ?? pos;
  }
  return [new vscode.Location(uri, pos ?? new vscode.Position(0, 0))];
}

async function resolveDotted(ref: string): Promise<vscode.Location[] | undefined> {
  const { module, symbol } = splitDotted(ref);
  const uris = await resolveDottedModuleToUris(module);
  if (uris.length === 0) return undefined;

  // Prefer first hit; if multiple, return all.
  const locs: vscode.Location[] = [];
  for (const uri of uris) {
    const doc = await vscode.workspace.openTextDocument(uri);
    if (symbol) {
      const pos = await findSymbolLine(doc, symbol);
      locs.push(new vscode.Location(uri, pos ?? new vscode.Position(0, 0)));
    } else {
      locs.push(new vscode.Location(uri, new vscode.Position(0, 0)));
    }
  }
  return locs;
}

export class DocstringDefinitionProvider implements vscode.DefinitionProvider, vscode.DocumentLinkProvider, vscode.HoverProvider {
  constructor(private proxy: ProxyManager) {}

  async provideDefinition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Definition | undefined> {
    if (!(inTripleQuotedString(document, position) || inComment(document, position))) return;

    const rng = wordRangeAt(document, position);
    if (!rng) return;
    const ref = document.getText(rng);

    // 1) Try local heuristics
    const tryLocal = async () => {
      if (PYTEST_NODEID.test(ref)) return (await resolvePytestNodeId(ref)) ?? undefined;
      if (DOTTED_REF.test(ref)) return (await resolveDotted(ref)) ?? undefined;
      return undefined;
    };
    const local = await tryLocal();
    if (local && local.length) return local;

    // 2) Optional: ask backend (when connected) for smarter resolution
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
      } catch (e) {
        // no-op; fall through to undefined
      }
    }
    // 3) Nothing found -> undefined (VS Code will show “No definition found”)
    return;
  }

  provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] | undefined {
    // Make refs clickable inside docstrings/comments
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();
    for (const m of text.matchAll(new RegExp(`${PYTEST_NODEID.source}|${DOTTED_REF.source}`, 'g'))) {
      const start = document.positionAt(m.index ?? 0);
      const end = document.positionAt((m.index ?? 0) + m[0].length);
      // Only turn into link if inside docstring or comment
      const mid = new vscode.Position(start.line, start.character + 1);
      if (!(inTripleQuotedString(document, mid) || inComment(document, mid))) continue;
      // Use command: URI so link reuses our DefinitionProvider
      const cmdUri = vscode.Uri.parse(`command:editor.action.revealDefinition`);
      const link = new vscode.DocumentLink(new vscode.Range(start, end), cmdUri);
      links.push(link);
    }
    return links;
  }

  async provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const rng = wordRangeAt(document, position);
    if (!rng || !(inTripleQuotedString(document, position) || inComment(document, position))) return;
    const ref = document.getText(rng);
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown(`**Reference:** \`${ref}\`\n\n[Go to definition](command:editor.action.revealDefinition)`);
    return new vscode.Hover(md, rng);
  }
}

export function registerDocstringRefProviders(context: vscode.ExtensionContext, proxy: ProxyManager) {
  const selector = { language: 'python', scheme: 'file' };
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, new DocstringDefinitionProvider(proxy)),
    vscode.languages.registerDocumentLinkProvider(selector, new DocstringDefinitionProvider(proxy)),
    vscode.languages.registerHoverProvider(selector, new DocstringDefinitionProvider(proxy)),
  );
}
