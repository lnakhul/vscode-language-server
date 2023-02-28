import { createConnection } from 'vscode-languageserver/node';
import { CompletionProvider } from './completion';
import { TextDocuments } from 'vscode-languageserver';
import { validateTextDocument } from './server';

jest.mock('vscode-languageserver/node', () => ({
  createConnection: jest.fn(),
}));

jest.mock('./completion', () => ({
  CompletionProvider: jest.fn().mockImplementation(() => ({
    provideCompletionItems: jest.fn(),
  })),
}));

jest.mock('vscode-languageserver', () => ({
  TextDocuments: jest.fn().mockImplementation(() => ({
    onDidChangeContent: jest.fn(),
    onDidClose: jest.fn(),
    all: jest.fn().mockReturnValue([]),
  })),
}));

describe('server', () => {
  let completionProvider: CompletionProvider;
  let documents: TextDocuments;
  let connection: any;

  beforeEach(() => {
    connection = createConnection();
    completionProvider = new CompletionProvider();
    documents = new TextDocuments();
  });

  it('should validate the text document', async () => {
    const textDocument = {
      getText: () => 'some text with a keyword',
      uri: 'some-uri',
      positionAt: jest.fn().mockReturnValue({ line: 0, character: 0 }),
    };

    const validateSpy = jest.spyOn(server, 'validateTextDocument');

    await validateTextDocument(textDocument as any);

    expect(validateSpy).toHaveBeenCalledWith(textDocument as any);
  });
});
