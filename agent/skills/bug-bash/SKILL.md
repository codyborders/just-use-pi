---
name: bug-bash
description: Fetch pending bugs from Detail CLI for the current repository, assess impact/severity/priority, fix the bugs, and write a comprehensive bug-bash report to code_reviews/. Use when the user wants to triage and fix open bugs, run a bug bash, or audit Detail bugs for the current project. Triggers on requests like "fix open bugs", "bug bash", "triage issues", "review and fix bugs".
---

# Bug Bash

Triage pending Detail bugs, fix them, and produce a detailed report written for junior engineers.

## Workflow

1. **Discover bugs** -- fetch pending bugs from Detail CLI for the current repo
2. **Assess each bug** -- assign impact, severity, and priority
3. **Fix bugs** -- implement fixes using Detail's code context and recommended fixes
4. **Write the report** -- document every finding with before/after code and plain-language explanations

## Step 1: Discover Bugs

Detect the current repository from the git remote:

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
```

Fetch pending bugs from Detail:

```bash
detail bugs list "$REPO" --format json --status pending --limit 100
```

The JSON response has this structure:

```json
{
  "items": [
    {
      "id": "bug_<uuid>",
      "title": "...",
      "summary": "...(markdown with sections: Summary, Code with Bug, Explanation, Recommended Fix)...",
      "filePath": "path/to/file.js",
      "isSecurityVulnerability": false,
      "createdAt": 1771619435742
    }
  ],
  "total": 3
}
```

If there are no pending bugs (`total` is 0 or `items` is empty), state that clearly and skip to the report step with a short summary.

## Step 2: Assess Each Bug

For every bug, determine:

| Field | Scale | Guidance |
|---|---|---|
| **Impact** | Critical / High / Medium / Low | How many users or systems does this affect? |
| **Severity** | Critical / Major / Minor / Cosmetic | How badly does it break things? Data loss = Critical. UI glitch = Cosmetic. |
| **Priority** | P0 / P1 / P2 / P3 | Combine impact + severity. P0 = fix immediately. P3 = backlog. |

Use Detail's analysis to make more informed assessments:

- The `summary` field contains root cause analysis, the buggy code, an explanation, and a recommended fix. Use all of this context when rating.
- If `isSecurityVulnerability` is `true`, automatically assign **Severity: Critical** or **Major** at minimum.
- The `filePath` field tells you exactly which file is affected -- use this to gauge blast radius.

Record a one-line rationale for each rating.

## Step 3: Fix Bugs

Work through bugs in priority order (P0 first).

For each fixable bug:

1. Read the file at `filePath` from the bug report to understand context.
2. Use the "Code with Bug" and "Recommended Fix" sections from the Detail `summary` as guidance for the fix.
3. Implement the fix using the Edit tool. Keep changes minimal and focused.
4. Run the project test suite if one exists to confirm the fix does not break anything.
5. After fixing, close the bug in Detail:
   ```bash
   detail bugs close <bug_id> --state resolved --notes "Fixed in bug bash"
   ```
6. Note any bugs that cannot be fixed (e.g., need more info, external dependency, feature request rather than bug) and explain why.

## Step 4: Write the Report

Create the `code_reviews/` directory in the project root if it does not exist.

Write the report to `code_reviews/YYYY-mm-dd-HHmm-bug-bash.md` using the current date and time (e.g., `2026-02-19-0830-bug-bash.md`).

### Report Template

Use this exact structure:

```markdown
# Bug Bash Report -- YYYY-MM-DD

## Summary

- **Repository**: owner/repo
- **Date**: YYYY-MM-DD HH:MM
- **Bugs reviewed**: N
- **Bugs fixed**: N
- **Bugs deferred**: N

## Triage Table

| # | Title | File Path | Security | Impact | Severity | Priority | Status |
|---|-------|-----------|----------|--------|----------|----------|--------|
| 1 | ...   | ...       | Yes / No | ...    | ...      | ...      | Fixed / Deferred / Needs Info |

---

## Detailed Findings

### Bug: <title>

**Detail Bug ID**: `<bug_id>`
**File**: `<filePath>`
**Security vulnerability**: Yes / No
**Impact**: <rating> | **Severity**: <rating> | **Priority**: <rating>
**Status**: Fixed / Deferred / Needs Info

#### What was the problem?

Explain the bug in plain language. What was going wrong, and how would a user experience it? Include relevant context from Detail's analysis.

#### What was changed?

Show before/after code snippets. Use fenced code blocks with the language identifier.

**Before:**
```python
# the old code
```

**After:**
```python
# the new code
```

#### How does the code work?

Walk through the fix step by step. Explain each line or block as if the reader has little coding experience. Use numbered steps.

1. First, we...
2. Then, we...
3. Finally, we...

#### Why was this change needed?

Explain the root cause and what the fix improves. Connect it back to the user-facing problem.

---

(Repeat for each bug)

## Deferred Issues

List bugs that were not fixed and explain why for each one. For deferred bugs, dismiss them in Detail:

```bash
detail bugs close <bug_id> --state dismissed --dismissal-reason <reason>
```

Valid dismissal reasons: `false_positive`, `wont_fix`, `duplicate`, `not_reproducible`.

### Bug: <title>

**Detail Bug ID**: `<bug_id>`
**File**: `<filePath>`
**Reason**: False positive / Won't fix / Duplicate / Not reproducible / Needs more context / etc.

**Recommendation**: What should happen next.
```

### Writing Guidelines

- Write for junior engineers who may have little coding experience.
- Explain every technical term the first time it appears.
- Use short sentences and active voice.
- Show real code from the repository, not pseudocode.
- For every finding, always cover WHAT changed, HOW the code works, and WHY the change matters.
- If a fix touches multiple files, explain each file's role.
- Always note when a bug is a security vulnerability and explain the security implications.
