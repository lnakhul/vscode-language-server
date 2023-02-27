import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  IPCMessageReader,
  IPCMessageWriter,
} from 'vscode-languageserver/node';

import {
  TextDocument
} from 'vscode-languageserver-textdocument';
import { CompletionProvider } from './completion';

import { validateTextDocument } from './server';

jest.mock('vscode-languageserver/node');
jest.mock('vscode-languageserver-textdocument');
jest.mock('./completion');

describe('server', () => {
  const connection = createConnection();
  const documents = new TextDocuments(TextDocument);
  const completionProvider = new CompletionProvider();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTextDocument', () => {
    it('should validate a text document', async () => {
      const settings = { maxNumberOfProblems: 1000 };
      const uri = 'file:///example.txt';
      const text = 'some text with a keyword';
      const document = new TextDocument(uri, 'plaintext', 1, text);
      const getDocumentSettings = jest.fn(() => Promise.resolve(settings));
      const expectedResult = [{
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: 0, character: 17 },
          end: { line: 0, character: 24 }
        },
        message: 'keyword is not a valid keyword',
        source: 'ex'
      }];
      const spy = jest.spyOn(documents, 'all').mockReturnValue([document]);
      const result = await validateTextDocument(document);
      expect(getDocumentSettings).toHaveBeenCalledWith(uri);
      expect(result).toBeUndefined();
      expect(connection.sendDiagnostics).toHaveBeenCalledWith({
        uri,
        diagnostics: expectedResult
      });
    });

    it('should return if there are no problems', async () => {
      const settings = { maxNumberOfProblems: 1000 };
      const uri = 'file:///example.txt';
      const text = 'some text without any keywords';
      const document = new TextDocument(uri, 'plaintext', 1, text);
      const getDocumentSettings = jest.fn(() => Promise.resolve(settings));
      const spy = jest.spyOn(documents, 'all').mockReturnValue([document]);
      const result = await validateTextDocument(document);
      expect(getDocumentSettings).toHaveBeenCalledWith(uri);
      expect(result).toBeUndefined();
      expect(connection.sendDiagnostics).not.toHaveBeenCalled();
    });
  });

  describe('onDidChangeConfiguration', () => {
    it('should revalidate all open text documents', () => {
      const change = { settings: { languageServerExample: {} } };
      const validateTextDocument = jest.fn();
      const spy = jest.spyOn(documents, 'all').mockReturnValue([
        { uri: 'file:///example.txt' }
      ]);
      const result = connection.onDidChangeConfiguration(change);
      expect(validateTextDocument).toHaveBeenCalledWith({ uri: 'file:///example.txt' });
    });
  });
});
