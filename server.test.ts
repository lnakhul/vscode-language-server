import { TextDocument } from 'vscode-languageserver-textdocument';
import { validateTextDocument } from './server';
import { createMockConnection } from 'vscode-languageserver/lib/test/mockConnection';

test('validateTextDocument', async () => {
  // Define a mock text document
  const textDocument = TextDocument.create('file:///test.txt', 'plaintext', 1, 'hello world');

  // Define a mock connection
  const connection = createMockConnection();

  // Mock the getConfiguration function
  connection.workspace.getConfiguration = jest.fn(() => Promise.resolve({ maxNumberOfProblems: 2 }));

  // Call the validateTextDocument function
  await validateTextDocument(textDocument, connection);

  // Expect the diagnostics to have been published
  expect(connection.sendDiagnostics).toHaveBeenCalledTimes(1);
});
