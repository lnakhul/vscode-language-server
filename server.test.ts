import { createConnection } from 'vscode-languageserver/node';
import { TextDocuments } from 'vscode-languageserver';
import { CompletionProvider } from './completion';
import { HoverProvider } from './hover';
import { validateTextDocument } from './server';

jest.mock('vscode-languageserver/node', () => ({
  createConnection: jest.fn(() => ({
    onInitialize: jest.fn(),
    onInitialized: jest.fn(),
    workspace: {
      onDidChangeWorkspaceFolders: jest.fn(),
    },
    client: {
      register: jest.fn(),
    },
  })),
}));

jest.mock('./completion', () => ({
  CompletionProvider: jest.fn(() => ({
    provideCompletionItems: jest.fn(),
    resolveCompletionItem: jest.fn(),
  })),
}));

jest.mock('./hover', () => ({
  HoverProvider: jest.fn(() => ({
    provideHover: jest.fn(),
  })),
}));

describe('validateTextDocument', () => {
  let mockConnection: any;
  let mockCompletionProvider: any;
  let mockHoverProvider: any;
  let mockDocuments: TextDocuments;
  let mockTextDocument: any;

  beforeEach(() => {
    mockConnection = createConnection();
    mockCompletionProvider = new CompletionProvider();
    mockHoverProvider = new HoverProvider();
    mockDocuments = new TextDocuments();
    mockTextDocument = {
      getText: jest.fn(),
      uri: 'file:///path/to/document.txt',
      languageId: 'plaintext',
      version: 1,
      lineCount: 10,
      offsetAt: jest.fn(),
      positionAt: jest.fn(),
    };
  });

  it('should validate the text document and return diagnostics', async () => {
    mockConnection.workspace.getConfiguration = jest.fn(() => Promise.resolve({ maxNumberOfProblems: 10 }));
    mockConnection.workspace.getWorkspaceFolder = jest.fn(() => ({ uri: 'file:///path/to/workspace' }));
    mockConnection.workspace.getWorkspaceFolders = jest.fn(() => [{ uri: 'file:///path/to/workspace' }]);
    mockDocuments.get = jest.fn(() => mockTextDocument);
    mockTextDocument.getText = jest.fn(() => 'Hello world');

    const diagnostics = await validateTextDocument(mockTextDocument, mockConnection, mockDocuments, mockCompletionProvider, mockHoverProvider);

    expect(diagnostics).toEqual([]);
    expect(mockConnection.workspace.getConfiguration).toHaveBeenCalledWith({
      scopeUri: mockTextDocument.uri,
      section: 'languageServerExample',
    });
  });
});
