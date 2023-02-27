describe("CompletionProvider", () => {
  let provider: CompletionProvider;
  
  beforeEach(() => {
    provider = new CompletionProvider();
  });

  describe("provideCompletionItems()", () => {
    it("should return an array of completion items", () => {
      const completionItems = provider.provideCompletionItems();
      expect(Array.isArray(completionItems)).toBe(true);
      expect(completionItems.length).toBeGreaterThan(0);
      const firstItem = completionItems[0];
      expect(typeof firstItem.label).toBe("string");
      expect(firstItem.kind).toBe(CompletionItemKind.Variable);
      expect(firstItem.data).toBe(1);
    });
  });

  describe("resolveCompletionItem()", () => {
    it("should set the detail and documentation of the completion item", () => {
      const item = { label: "Paul", kind: CompletionItemKind.Variable, data: 1 };
      const resolvedItem = provider.resolveCompletionItem(item);
      expect(resolvedItem.detail).toBe("Variable");
      expect(resolvedItem.documentation).toBe("This is a variable");
    });
  });
});
