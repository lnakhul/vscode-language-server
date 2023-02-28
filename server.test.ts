import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  IPCMessageReader,
  IPCMessageWriter,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionProvider } from './completion';

// Import the module you want to test
import { getDocumentSettings } from './server';

// Mock the dependencies of the module being tested
jest.mock('vscode-languageserver/node', () => {
  const { EventEmitter } = require('events');
  const connection = new EventEmitter();
  connection.onInitialize = jest.fn();
  connection.onInitialized = jest.fn();
  connection.onDidChangeConfiguration = jest.fn();
  return {
    createConnection: jest.fn(() => connection),
    TextDocuments: jest.fn(),
    Diagnostic: jest.fn(),
    DiagnosticSeverity: jest.fn(),
    InitializeParams: jest.fn(),
    DidChangeConfigurationNotification: jest.fn(),
    CompletionItem: jest.fn(),
    TextDocumentPositionParams: jest.fn(),
    TextDocumentSyncKind: jest.fn(),
    InitializeResult: jest.fn(),
    IPCMessageReader: jest.fn(),
    IPCMessageWriter: jest.fn(),
  };
});

jest.mock('./completion', () => {
  return {
    CompletionProvider: jest.fn(),
  };
});

// Write a test suite for the module
describe('getDocumentSettings', () => {
  it('should return global settings when no configuration capability is available', async () => {
    // Create a mock connection object
    const connection = createConnection();
    const documentUri = 'file:///path/to/document';

    // Mock the connection.workspace.getConfiguration() method
    connection.workspace.getConfiguration = jest.fn().mockResolvedValueOnce({
      maxNumberOfProblems: 1000,
    });

    // Call the function being tested
    const result = await getDocumentSettings(documentUri, connection);

    // Verify that the function returns the correct value
    expect(result).toEqual({ maxNumberOfProblems: 1000 });
  });

  it('should return document settings when configuration capability is available', async () => {
    // Create a mock connection object
    const connection = createConnection();
    const documentUri = 'file:///path/to/document';

    // Mock the connection.workspace.getConfiguration() method
    connection.workspace.getConfiguration = jest.fn().mockResolvedValueOnce({
      languageServerExample: {
        maxNumberOfProblems: 2000,
      },
    });

    // Call the function being tested
    const result = await getDocumentSettings(documentUri, connection);

    // Verify that the function returns the correct value
    expect(result).toEqual({ maxNumberOfProblems: 2000 });
  });
});
