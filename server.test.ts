import { createConnection, TextDocuments } from 'vscode-languageserver/node';
import { CompletionProvider } from './completion';
import { IPCMessageReader, IPCMessageWriter } from 'vscode-jsonrpc';

jest.mock('vscode-languageserver/node', () => ({
  createConnection: jest.fn(() => ({
    onInitialize: jest.fn(),
    onInitialized: jest.fn(),
    listen: jest.fn(),
  })),
}));

jest.mock('./completion', () => ({
  CompletionProvider: jest.fn(() => ({
    register: jest.fn(),
  })),
}));

jest.mock('vscode-jsonrpc', () => ({
  IPCMessageReader: jest.fn(),
  IPCMessageWriter: jest.fn(),
}));

describe('Server initialization', () => {
  const mockedConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
  const mockedDocuments = new TextDocuments();
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

    (mockedConnection.onInitialize as jest.Mock).mockImplementationOnce((handler) => {
      const initializeResult = handler(params);
      expect(initializeResult).toEqual(expectedInitializeResult);
      return initializeResult;
    });

    (mockedConnection.onInitialized as jest.Mock).mockImplementationOnce((handler) => {
      handler();
    });

    mockedDocuments.listen(mockedConnection);

    mockedDocuments.onDidClose(e => {
      mockedCompletionProvider.onDocumentClosed(e.document);
    });

    mockedDocuments.onDidChangeContent(e => {
      mockedCompletionProvider.onDocumentChanged(e.document);
    });

    (mockedCompletionProvider.register as jest.Mock).mockImplementationOnce(() => {
      expect(mockedDocuments.onDidClose).toHaveBeenCalledTimes(1);
      expect(mockedDocuments.onDidChangeContent).toHaveBeenCalledTimes(1);
    });

    require('./server'); // the module that exports the server implementation

    expect(mockedConnection.onInitialize).toHaveBeenCalledTimes(1);
    expect(mockedConnection.onInitialized).toHaveBeenCalledTimes(1);
    expect(mockedConnection.listen).toHaveBeenCalled();
    expect(mockedCompletionProvider.register).toHaveBeenCalledTimes(1);
  });
});
