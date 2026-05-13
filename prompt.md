The Backend Impact webview now opens correctly from CodeLens and focuses the correct tab. The next improvement is to make the webview interactive instead of mostly read-only.

Please add a webview message/action bridge so users can click items in the Backend Impact webview and trigger extension actions.

Requirements:

1. Webview actions
Add message types for:
- openSource
- openLocation
- revealSymbol
- openImport
- openTestCandidate
- generateTestScaffold
- copyMarkdown
- exportMarkdown
- refreshAnalysis
- showReferences
- showCallHierarchy

2. Source navigation
Any symbol, import, Sandra access item, or line-numbered report entry should be clickable.
When clicked, the extension should open the original Python file at the correct line and column.

3. Focused symbol actions
In the Overview tab, add buttons:
- Open Source
- Reveal Symbol
- Show References
- Show Call Hierarchy
- Generate Test
- Export Markdown

4. Sandra Access actions
In the Sandra Access tab, each operation row should show:
- operation type
- risk level
- confidence
- line number
- expression
- containing symbol

Each row should support:
- Open Line
- Copy Expression
- Add to Validation Checklist

5. Imports actions
In the Imports tab, each import should support:
- Open Resolved Module if available
- Copy Import
- Mark unresolved if not resolved

If import resolution is not available yet, keep the action disabled and show “Resolution unavailable.”

6. Recommended Tests actions
In the Recommended Tests tab:
- Show suggested test file path
- Show suggested pytest test case names
- Add buttons:
  - Generate Scaffold
  - Copy Test Plan
  - Open Existing Test File if found

7. Generate Test behavior
Generate Test should create a pytest scaffold for the selected symbol.
Open it in a new unsaved editor or ask the user to choose an existing test file.
Never overwrite existing test files silently.
Include TODOs for inputs, mocks, Sandra/backend dependencies, function call, and assertions.

8. Export Markdown
Raw Markdown should remain available, but markdown files should only be opened when the user clicks Export Markdown.
CodeLens clicks should not directly open markdown files.

9. Refresh
Add a Refresh Analysis button in the webview.
It should rerun analysis for the same file/symbol/action and update the panel.

10. Safety
Do not execute backend Python code.
Do not query or mutate Sandra automatically.
Do not modify workspace files except when user explicitly confirms test scaffold insertion.

11. UX
Make rows visually clickable.
Use buttons or links consistently.
Support dark/light themes.
Show disabled actions with clear tooltip text when data is unavailable.