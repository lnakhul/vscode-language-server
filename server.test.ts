import { createConnection, TextDocuments } from '../../../server/node_modules/vscode-languageserver/node';
import { TextDocument } from '../../../server/node_modules/vscode-languageserver-textdocument';
import { CompletionProvider } from './completion';

//const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

jest.mock('vscode-languageserver/node', () => ({
  createConnection: jest.fn(),
}));

jest.mock('vscode-languageserver-textdocument', () => ({
  TextDocuments: jest.fn(),
}));

jest.mock('./completion', () => ({
  CompletionProvider: jest.fn(),
}));

describe('Server initialization', () => {
  const mockedConnection = createConnection();
  const mockedDocuments = new TextDocuments(TextDocument);
  const mockedCompletionProvider = new CompletionProvider();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize the server', () => {
    const params = {
      capabilities: {},
      rootUri: null,
      workspaceFolders: null,
    };
    const expectedCapabilities = {
      textDocumentSync: 2,
      completionProvider: {
        resolveProvider: true,
      },
    };
    const expectedInitializeResult = { capabilities: expectedCapabilities };

    mockedConnection.onInitialize.mockImplementationOnce((callback) => {
      const initializeResult = callback(params);
      expect(initializeResult).toEqual(expectedInitializeResult);
      return initializeResult;
    });

    mockedConnection.onInitialized.mockImplementationOnce((callback) => {
      callback();
    });

    require('./server'); // the module that exports the server implementation

    expect(mockedConnection.onInitialize).toHaveBeenCalledTimes(1);
    expect(mockedConnection.onInitialized).toHaveBeenCalledTimes(1);
    expect(mockedConnection.listen).not.toHaveBeenCalled();
    expect(mockedDocuments.onDidClose).toHaveBeenCalledTimes(1);
    expect(mockedDocuments.onDidChangeContent).toHaveBeenCalledTimes(1);
    expect(mockedCompletionProvider.register).toHaveBeenCalledTimes(1);
  });
});
