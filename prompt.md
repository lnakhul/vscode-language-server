No We are implementing a single Jira ticket and one PR for a new Quartz VS Code extension feature called “Quartz Backend Impact Intelligence.”

This work should be implemented in multiple logical phases, with each phase kept clean enough to be committed separately.

Context:
- The extension is built in TypeScript and supports developers working in Quartz/Sandra-backed source workflows.
- Quartz users primarily write Python backend/service code for various trains on the Quartz platform and Sandra DB.
- Existing context menu features already include Go to Definition, Find References, Call Hierarchy, Run Selection in Quartz Shell, Run Quartz Module, and Generate Docstring.
- This new feature must not duplicate those existing navigation or execution features.
- The feature should provide deeper Quartz-specific backend coding intelligence.

Goal:
Help developers answer:
- What Python symbols exist in this file?
- What imports and dependencies does this code use?
- What Sandra DB operations does this code read/write/list?
- What Quartz source/train/stage context am I editing in?
- Are imports resolving from the expected source layer?
- What risks exist if I change this code?
- What tests should I run?
- What validation steps should I follow?

Important constraints:
- Do not execute backend Python code during analysis.
- Do not mutate Sandra, source cache, staging areas, or user files except when the user explicitly applies a generated test scaffold.
- Keep analysis static/read-only.
- Avoid expensive scans on every keystroke.
- Reuse existing Quartz extension helpers where available, including source cache helpers, URI/path utilities, command registration patterns, logging, disposables, and webview conventions.
- Keep implementation modular and avoid coupling the analyzer directly to UI rendering.
- Follow existing Quartz coding conventions.

User-facing commands:
- Quartz: Analyze Backend Impact
- Quartz: Trace Sandra Access
- Quartz: Recommend Tests for Current File
- Quartz: Generate Python Test Scaffold
- Quartz: Analyze Backend Impact for Current Changes

Expected report sections:
- Current File
- Current Symbol
- Quartz Context
- Python Symbols
- Imports
- Import Resolution
- Sandra Access Summary
- Risk Warnings
- Recommended Tests
- Validation Checklist

Editor UX requirement:
Add a CodeLens-style experience for supported Python files.

When a developer opens a Python backend file, the extension should show CodeLens actions above detected classes, functions, and methods where appropriate.

The initial CodeLens actions should include:
- Quartz: Analyze Impact
- Quartz: Trace Sandra Access
- Quartz: Recommend Tests
- Quartz: Generate Test

The CodeLens actions should:
- Run analysis for the current file and selected symbol
- Pass file path, line number, and symbol name into the analyzer
- Avoid excessive clutter in large files
- Be configurable through a setting such as quartz.backendImpact.enableCodeLens
- Never execute backend Python code or mutate Sandra/source state

The CodeLens feature should not duplicate Go to Definition, References, or Call Hierarchy. It should provide Quartz-specific backend impact analysis, Sandra access tracing, and validation guidance.

Implement this across phases/commits:
1. Backend impact framework and Python scanner
2. Sandra access detection
3. Quartz source/train context resolution
4. CodeLens and editor context menu actions
5. Test recommendation and scaffold generation
6. Webview report with risk scoring
7. Import resolution and source-layer ambiguity detection
8. Change-aware backend impact analysis

Do not implement everything in one giant file. Create modular files under a feature folder such as src/backendImpact/.



==================================

The current Backend Impact CodeLens implementation opens static markdown reports when clicking Analyze Impact, Trace Sandra Access, Recommend Tests, and Generate Test. This is a good start, but we need to make the feature more editor-focused and symbol-aware.

Please update the implementation so that each CodeLens action is scoped to the function, method, or class where the CodeLens appears. When the user clicks a CodeLens action, pass the file path, symbol name, symbol type, start line, end line, and cursor context into the analyzer.

Requirements:

1. Symbol-specific reports:
   - Analyze Impact should focus on the selected symbol first, then include file-level context below.
   - Trace Sandra Access should only show Sandra operations inside the selected symbol when possible.
   - Recommend Tests should generate recommendations for the selected symbol, not only the whole file.
   - Generate Test should generate a pytest scaffold for the selected symbol.

2. Clickable source navigation:
   - Any report entry that references a function, class, import, Sandra operation, or line number should provide a clickable link or command that opens the original Python file at that line.
   - Reuse existing Quartz URI/deep-link helpers if available.
   - If command links are not safe/supported in markdown, add extension commands to open file locations from report entries.

3. Sandra access classification:
   - Improve Sandra access output from generic query lines into classified operations.
   - Classify operations as read, write, create/update, traversal, external service call, or unknown.
   - Include confidence level, containing symbol, line number, expression text, and risk level.
   - Treat patterns such as obj.write(), saveOnMessageObject(...), save*Object(...), readobj(...), read_or_new(...), sandra.nameRange(...), sandra.walk(...), delete/remove/rename/move/clear/overwrite/update as relevant backend persistence operations.

4. Recommended tests:
   - Recommend existing related test files if found.
   - If no test file is found, suggest a likely test file name and path.
   - Suggest concrete pytest test case names based on the selected function.
   - Include reasons for each recommendation.

5. Generate Test:
   - Generate a pytest scaffold in a new unsaved editor or insert into a selected test file only after confirmation.
   - Do not overwrite existing tests silently.
   - Include TODOs for arranging inputs, mocking Sandra/backend dependencies, calling the selected function, and asserting expected behavior.
   - If Sandra operations are detected, include TODOs for Sandra mocks and write assertions.

6. Safety:
   - Do not execute backend Python code.
   - Do not query or mutate Sandra automatically.
   - Live Sandra inspection can be added later as an explicit action only.

7. UX:
   - Markdown reports are acceptable for now, but they must be actionable, symbol-scoped, and clickable.
   - Avoid generating giant file-level reports when the user clicked CodeLens on a specific function.