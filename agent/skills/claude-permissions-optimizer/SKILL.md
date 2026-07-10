---
name: claude-permissions-optimizer
context: fork
description: Optimize Claude Code permissions by finding safe Bash commands from session history and auto-applying them to settings.json. Can run from any coding agent but targets Claude Code specifically. Use when experiencing permission fatigue, too many permission prompts, wanting to optimize permissions, or needing to set up allowlists. Triggers on "optimize permissions", "reduce permission prompts", "allowlist commands", "too many permission prompts", "permission fatigue", "permission setup", or complaints about clicking approve too often.
---

# Claude Permissions Optimizer

Use Claude Code session history to find frequently approved Bash commands that can safely enter an allowlist. The bundled classifier supplies the recommendations. Do not use this workflow to approve destructive patterns such as `rm -rf` or `git push --force`; users can make exceptional changes directly in `settings.json`.

## Environment Check

Identify the current coding agent before analyzing data. Inside Claude Code, continue immediately. From another agent, state that the workflow reads Claude Code history and updates Claude Code settings for the user's next Claude Code session. Continue only when `~/.claude/` or `$CLAUDE_CONFIG_DIR` exists.

## 1. Choose Scope

Ask through the platform's blocking question tool. Use `ask_user_question` in Claude Code, `request_user_input` in Codex, or `ask_user` in Gemini. When no question tool exists, display the choices and wait.

| Choice | Scope |
|--------|-------|
| All projects (recommended) | Sessions from every project |
| Current project | Sessions associated with the working directory |
| Custom | User-defined date, count, or project constraints |

Use all projects unless the request already limits scope. A wider sample usually produces stronger evidence.

## 2. Extract Commands

Run the bundled script for the selected scope:

```bash
# Every project
node <skill-dir>/scripts/extract-commands.mjs

# Current project. Encode the absolute path by replacing non-alphanumeric characters with dashes.
# Example: /Users/alice/Code/my-project becomes -Users-alice-Code-my-project
node <skill-dir>/scripts/extract-commands.mjs --project-slug <slug>
```

Add `--days <N>` when the user requests a date limit. Without that option, the script examines available history, capped at the newest 500 sessions or 30 days. It loads existing rules, removes covered commands, requires at least five occurrences, converts commands to `Bash(pattern)` rules, and classifies risk.

The JSON output contains these fields:

| Field | Contents |
|-------|----------|
| `green` | Recommended patterns with counts, sessions, and examples |
| `redExamples` | Up to five rejected dangerous patterns with reasons |
| `yellowFootnote` | Frequent commands that need manual judgment, or `null` |
| `stats` | Extraction, filtering, coverage, and result counts |

Present the classifier's decision without changing its risk category. Empty recommendations mean the current rules already cover the history or the sample is too small. Report that result and suggest another analysis after more sessions.

## 3. Present Findings

Start with four or five lines covering scope and the values from `stats`. Then show `green` in a numbered table:

```text
### Safe to auto-allow
| # | Pattern | Evidence |
|---|---------|----------|
| 1 | `Bash(bun test *)` | 23 uses across 8 sessions |
| 2 | `Bash(bun run *)` | 18 uses across build, lint, and development tasks |
| 3 | `Bash(node *)` | 12 uses across 5 sessions |
```

Place a non-null `yellowFootnote` directly below that table. When `redExamples` has entries, add a compact blocked table with at most three rows:

```text
### Blocked from recommendations
| Pattern | Reason | Uses |
|---------|--------|------|
| `rm *` | Irreversible file deletion | 21 |
| `eval *` | Arbitrary code execution | 14 |
| `git reset --hard *` | Destroys uncommitted work | 5 |
```

End with one short sentence describing the projected coverage change. Calculate current coverage as `alreadyCovered / totalExtracted * 100`. Calculate projected coverage as `(alreadyCovered + greenRawCount) / totalExtracted * 100`. Use `greenRawCount` because it measures raw commands covered by the proposed patterns.

## 4. Confirm the Change

After displaying the tables, ask whether to apply every recommendation to user settings, apply them to project settings, or skip. Free-text replies may exclude numbered rows, such as "all except 3 and 7 to user settings." Do not repeat the table inside the question UI.

## 5. Update Settings

For each selected file:

1. Read the existing content. When absent, start with `{ "permissions": { "allow": [] } }`.
2. Append patterns to `permissions.allow` while removing duplicates.
3. Sort the array alphabetically and write two-space-indented JSON.
4. Tell the user that JSON validation is starting, then parse the saved file:

```bash
node -e "JSON.parse(require('fs').readFileSync('<path>','utf8'))"
```

A parse failure requires immediate restoration from the content read before the edit. Report the failure and stop before touching another file.

After validation, report how many rules entered each settings file and state that those commands will stop prompting. If `.claude/settings.json` is tracked, note that committing it can share the rules with teammates.

## Boundary Cases

| Condition | Response |
|-----------|----------|
| No project context | Offer only user-level settings |
| Missing settings file | Create the minimal permissions object; create `.claude/` when needed |
| Existing deny rule | Warn the user and omit the conflicting allow rule because deny takes precedence |
