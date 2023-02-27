import { createConnection } from 'vscode-languageserver/node';
import { TextDocuments } from 'vscode-languageserver-textdocument';
import { CompletionProvider } from './completion';
import {
  initializeServer,
  onDidChangeConfiguration,
  getDocumentSettings,
  validateTextDocument,
} from './server';

jest.mock('vscode-languageserver/node', () => ({
  createConnection: jest.fn(),
}));

jest.mock('vscode-languageserver-textdocument', () => ({
  TextDocuments: jest.fn(),
}));

jest.mock('./completion', () => ({
  CompletionProvider: jest.fn(),
}));

describe('initializeServer', () => {
  const connection = createConnection();
  const documents = new TextDocuments();
  const completionProvider = new CompletionProvider();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers onInitialize callback', () => {
    initializeServer(connection, documents, completionProvider);
    expect(connection.onInitialize).toHaveBeenCalledTimes(1);
  });

  it('registers onDidChangeConfiguration callback', () => {
    initializeServer(connection, documents, completionProvider);
    expect(connection.onDidChangeConfiguration).toHaveBeenCalledTimes(1);
  });

  it('registers onDidChangeWorkspaceFolders callback', () => {
    initializeServer(connection, documents, completionProvider);
    expect(connection.workspace.onDidChangeWorkspaceFolders).toHaveBeenCalledTimes(1);
  });
});

describe('onDidChangeConfiguration', () => {
  const connection = createConnection();
  const documents = new TextDocuments();
  const completionProvider = new CompletionProvider();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getDocumentSettings for every open document', () => {
    const document1 = { uri: 'document1' };
    const document2 = { uri: 'document2' };
    documents.set(document1.uri, document1 as any);
    documents.set(document2.uri, document2 as any);

    onDidChangeConfiguration(connection, documents, completionProvider);

    expect(getDocumentSettings).toHaveBeenCalledWith(document1.uri);
    expect(getDocumentSettings).toHaveBeenCalledWith(document2.uri);
  });
});

describe('validateTextDocument', () => {
  const document = {
    uri: 'document',
    getText: jest.fn().mockReturnValue('some text'),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getDocumentSettings', async () => {
    await validateTextDocument(document, {} as any);

    expect(getDocumentSettings).toHaveBeenCalledWith(document.uri);
  });
});
