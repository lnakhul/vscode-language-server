import { expect } from 'chai';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { createMockConnection } from 'vscode-languageserver/lib/test/mockConnection';
import { CompletionProvider } from './completion';
import { HoverProvider } from './hover';
import { validateTextDocument } from './server';

describe('Server', () => {
  it('should return no diagnostics for a valid text document', async () => {
    const document = TextDocument.create('file://test.txt', 'plaintext', 1, 'Hello world');
    const provider = new CompletionProvider();
    const hoverProvider = new HoverProvider();
    const connection = createMockConnection();
    const result = await validateTextDocument(document, provider, hoverProvider, connection);
    expect(result).to.have.lengthOf(0);
  });

  it('should return diagnostics for an invalid text document', async () => {
    const document = TextDocument.create('file://test.txt', 'plaintext', 1, 'Invalid keyword');
    const provider = new CompletionProvider();
    const hoverProvider = new HoverProvider();
    const connection = createMockConnection();
    const result = await validateTextDocument(document, provider, hoverProvider, connection);
    expect(result).to.have.lengthOf(1);
    expect(result[0].severity).to.equal(DiagnosticSeverity.Warning);
    expect(result[0].range.start.line).to.equal(0);
    expect(result[0].range.start.character).to.equal(0);
    expect(result[0].range.end.line).to.equal(0);
    expect(result[0].range.end.character).to.equal(7);
  });
});
