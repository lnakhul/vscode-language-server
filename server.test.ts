import { createConnection } from 'vscode-languageserver/node';
import { TextDocuments } from 'vscode-languageserver-textdocument';
import { CompletionProvider } from './completion';

jest.mock('vscode-languageserver/node', () => ({
  createConnection: jest.fn(),
}));

jest.mock('vscode-languageserver-textdocument', () => ({
  TextDocuments: jest.fn(),
}));

jest.mock('./completion', () => ({
  CompletionProvider: jest.fn(),
}));

describe('Server connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a connection for the server', () => {
    const createConnectionMock = createConnection as jest.Mock;
    const connectionMock = {
      onInitialize: jest.fn(),
      onInitialized: jest.fn(),
      onDidChangeConfiguration: jest.fn(),
      workspace: {
        onDidChangeWorkspaceFolders: jest.fn(),
      },
    };
    createConnectionMock.mockReturnValueOnce(connectionMock);

    const documentsMock = {
      onDidClose: jest.fn(),
      onDidChangeContent: jest.fn(),
      all: jest.fn(),
    };
    const textDocumentMock = {};
    documentsMock.all.mockReturnValueOnce([textDocumentMock]);
    const TextDocumentsMock = TextDocuments as jest.Mock;
    TextDocumentsMock.mockReturnValueOnce(documentsMock);

    const CompletionProviderMock = CompletionProvider as jest.Mock;
    CompletionProviderMock.mockImplementationOnce(() => ({
      provideCompletionItems: jest.fn(),
    }));

    const argv = [];
    createConnection();

    expect(createConnectionMock).toHaveBeenCalledWith(process.stdin, process.stdout);
    expect(TextDocumentsMock).toHaveBeenCalledWith(textDocumentMock);
    expect(CompletionProviderMock).toHaveBeenCalled();
    expect(connectionMock.onInitialize).toHaveBeenCalled();
    expect(connectionMock.onInitialized).toHaveBeenCalled();
    expect(connectionMock.onDidChangeConfiguration).toHaveBeenCalled();
    expect(connectionMock.workspace.onDidChangeWorkspaceFolders).toHaveBeenCalled();
    expect(documentsMock.onDidClose).toHaveBeenCalled();
    expect(documentsMock.onDidChangeContent).toHaveBeenCalled();
    expect(documentsMock.all).toHaveBeenCalled();
  });
});
