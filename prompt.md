The current Backend Impact CodeLens implementation opens generated Markdown files when clicking Analyze Impact, Trace Sandra Access, Recommend Tests, or Generate Test. This is too static.

Please refactor this into an interactive Backend Impact webview/workbench.

Goal:
When a user clicks any Backend Impact CodeLens action, open or reveal a single interactive webview panel titled “Quartz Backend Impact”. The webview should render a structured, clickable report for the selected Python symbol and file instead of only opening a .md file.

Requirements:

1. CodeLens behavior
- Keep the existing CodeLens labels:
  - Analyze Impact
  - Trace Sandra Access
  - Recommend Tests
  - Generate Test
- Clicking any CodeLens should call a command with symbol context:
  - filePath
  - workspaceRelativePath
  - symbolName
  - symbolType
  - startLine
  - endLine
  - selected action
- Do not open a Markdown file as the primary action.
- Markdown should only be available through an Export Markdown action.

2. Add webview panel
Create a reusable webview panel, for example:
- BackendImpactWebviewPanel
- BackendImpactReportView.tsx if React webviews are used
- backendImpactMessages.ts for message types

The panel should have sections or tabs:
- Overview
- Quartz Context
- Sandra Access
- Imports
- Recommended Tests
- Validation Checklist
- Raw Markdown / Export

3. Symbol-specific analysis
- Analyze the selected symbol first.
- Only show Sandra access inside the selected symbol where possible.
- Include file-level context below the selected-symbol section.
- If symbol-specific filtering is not possible, clearly label the result as file-level analysis.

4. Interactive code navigation
In the webview, any file, symbol, import, Sandra operation, or test candidate should be clickable.
Implement webview messages for:
- openLocation(filePath, line, column?)
- openFile(filePath)
- revealSymbol(filePath, startLine)
- openTestCandidate(filePath)
- copyMarkdown()
- exportMarkdown()
- generateTestScaffold()

Opening a location should open the original Python file at the exact line.

5. Report content
The Overview section should show:
- focused symbol name
- symbol type
- line range
- file/module name
- risk level: low/medium/high
- short summary

The Quartz Context section should show:
- workspace path
- source cache path if detected
- module path
- train/stage/source layer if available
- context warnings if unresolved

The Sandra Access section should show:
- operation type: read/write/create/update/delete/traversal/unknown
- expression text
- line number
- containing symbol
- confidence level
- risk level
- clickable source link

Detect and classify patterns such as:
- db.readobj(...)
- db.read(...)
- db.read_or_new(...)
- obj.write()
- sandra.nameRange(...)
- sandra.walk(...)
- save*Object(...)
- saveOnMessageObject(...)
- write/update/delete/remove/rename/move/clear/overwrite calls

The Imports section should show:
- internal/project imports
- external imports
- unresolved imports
- clickable resolved import locations where available

The Recommended Tests section should show:
- existing candidate test files if found
- suggested test file path if none found
- suggested pytest test case names
- reasons for each recommendation

The Validation Checklist section should show actionable items:
- review callers of selected symbol
- confirm imported collaborators resolve in target runtime
- run or add recommended tests
- validate Sandra write/read behavior if detected
- confirm source layer/train context
- review error handling/logging around risky operations

6. Generate Test action
- Generate Test should not simply open a report.
- It should generate a pytest scaffold for the selected symbol.
- Open the scaffold in a new unsaved editor or ask the user to choose an existing test file.
- Never overwrite existing tests silently.
- Include TODOs for arranging inputs, mocking Sandra/backend dependencies, calling the selected function, and asserting expected behavior.

7. Export Markdown
- Add an Export Markdown button in the webview.
- Export should create the markdown summary only when explicitly requested.
- The generated markdown should match the webview content and include clickable source references where possible.

8. Safety
- Do not execute backend Python code.
- Do not automatically query Sandra.
- Do not mutate Sandra, source cache, or workspace files unless the user explicitly confirms generating/inserting a test scaffold.
- Keep all backend impact analysis static/read-only.

9. UX
- Reuse existing webview CSP, nonce, styling, and message handling patterns from the Quartz extension.
- Support dark/light themes.
- Avoid giant wall-of-text reports.
- Make the report scannable with cards, collapsible sections, or tabs.
- Show empty states such as:
  - No Sandra access detected in selected symbol
  - No related tests found
  - Quartz context could not be resolved
  - Import resolution unavailable

10. Backward compatibility
- Existing analyzer/scanner modules should remain reusable.
- The markdown report generator can remain, but it should be called only by Export Markdown.
- The CodeLens command wiring should be updated to open the webview.