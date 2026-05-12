We are implementing a single Jira ticket and one PR for a new Quartz VS Code extension feature called “Quartz Backend Impact Intelligence.”

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