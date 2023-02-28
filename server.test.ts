import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionProvider } from './completion';
import { initializeServer } from './server';

jest.mock('vscode-languageserver/node', () => {
  const createConnection = jest.fn();
  const ProposedFeatures = jest.fn();
  return { createConnection, ProposedFeatures };
});

jest.mock('vscode-languageserver-textdocument', () => {
  const TextDocument = jest.fn();
  return { TextDocument };
});

jest.mock('./completion', () => {
  const CompletionProvider = jest.fn();
  return { CompletionProvider };
});

describe('initializeServer', () => {
  let connection;
  let documents;
  let completionProvider;
  let hasConfigurationCapability;
  let hasWorkspaceFolderCapability;
  let hasDiagnosticRelatedInformationCapability;

  beforeEach(() => {
    connection = {
      onInitialize: jest.fn(),
      onInitialized: jest.fn(),
      onDidChangeConfiguration: jest.fn(),
      client: {
        register: jest.fn(),
      },
      workspace: {
        onDidChangeWorkspaceFolders: jest.fn(),
        getConfiguration: jest.fn(),
      },
      console: {
        log: jest.fn(),
      },
    };
    createConnection.mockReturnValue(connection);
    documents = {
      onDidClose: jest.fn(),
      onDidChangeContent: jest.fn(),
      all: jest.fn(),
    };
    TextDocument.mockReturnValue(documents);
    completionProvider = {
      onCompletion: jest.fn(),
      onCompletionResolve: jest.fn(),
    };
    CompletionProvider.mockReturnValue(completionProvider);
    hasConfigurationCapability = false;
    hasWorkspaceFolderCapability = false;
    hasDiagnosticRelatedInformationCapability = false;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should initialize the server', () => {
    const params = {
      capabilities: {
        workspace: {},
        textDocument: {
          publishDiagnostics: {},
        },
      },
    };
    initializeServer();
    expect(createConnection).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      ProposedFeatures,
    );
    expect(connection.onInitialize).toHaveBeenCalled();
    expect(connection.onInitialized).toHaveBeenCalled();
    expect(connection.onDidChangeConfiguration).toHaveBeenCalled();
    expect(connection.client.register).toHaveBeenCalled();
    expect(connection.workspace.onDidChangeWorkspaceFolders).toHaveBeenCalled();
    expect(TextDocument).toHaveBeenCalledWith(TextDocument);
    expect(CompletionProvider).toHaveBeenCalledWith();
  });
});
