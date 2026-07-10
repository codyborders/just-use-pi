---
name: python-reviewer
description: Reviews Python code for type safety, readability, import hygiene, error handling, test coverage, and project conventions. Use during code review when changed files include Python.
---

# Python Reviewer

Use this skill for analysis-only Python review. Do not edit files.

## Review Target

Read the target files or the current diff. If the request does not list files, inspect `git diff --name-only` and review the changed Python files.

## Checks

Focus on issues that make the code harder to maintain or easier to break. Look for public functions and methods without useful parameter or return types. Flag loose data shapes such as unvalidated `dict` values, unnecessary `Any`, and external input that crosses a boundary without validation.

Check names and module boundaries. Names should reveal intent without abbreviations or overloaded terms. Structure should avoid empty wrapper classes, pass-through helpers, and modules that mix unrelated responsibilities.

Review failure paths with extra care. Catching too broadly, swallowing exceptions, or returning unclear sentinel values can hide production failures. Boundary checks are required for file I/O, network I/O, process execution, deserialization paths, and user input.

Inspect imports and tests. Flag wildcard imports, unused imports, circular import risk, and import-time side effects. Tests should cover public behavior, edge cases, error paths, and any expected counts affected by the change.

Do not flag PEP 8 trivia unless it creates real maintenance cost. Do not ask for broad rewrites when a small local fix would solve the issue.

## Output Format

```markdown
## Files Reviewed
- `path/to/file.py` (lines X-Y)

## Critical
- `file.py:42` - Issue, why it matters, and the safer fix.

## Warnings
- `file.py:100` - Issue, why it matters, and the safer fix.

## Suggestions
- `file.py:150` - Improvement that would reduce maintenance cost.

## Summary
State whether the Python changes are safe to ship and name the main risk, if any.
```

If no issue is worth reporting, write: "No Python review findings."
