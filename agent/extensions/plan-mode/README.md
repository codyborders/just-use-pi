# Plan Mode Extension

Plan Mode adds a Claude Code-style `/plan` flow to pi. While enabled, the agent can inspect the repository and prepare an implementation plan, but it cannot edit files or run state-changing commands.

## Entry Points

Use `/plan` to toggle the mode. Press `Ctrl+Shift+P` for the same toggle in the interactive UI. Start pi with `--plan` to begin a session already in plan mode.

## Plan Workflow

After plan mode is enabled, ask the agent to inspect the code and propose a change. The extension limits active tools to `read`, `bash`, `grep`, `find`, and `ls`. Bash calls pass through an allowlist that accepts read-only commands such as `ls`, `cat`, `git status`, `git log`, `git diff`, `rg`, and `find`. Commands that write files, install packages, alter git state, or open editors are blocked before execution.

The agent response must end with a numbered plan under `### Plan:` and a short `Critical Files for Implementation` section.

```
### Plan:
1. First step description
2. Second step description
3. Third step description
...

### Critical Files for Implementation
- path/to/file1.ts
- path/to/file2.ts
```

When the agent finishes, the extension extracts the numbered steps and critical files. The UI then asks whether to execute, stay in plan mode, or refine the plan. If execution starts, the extension restores the normal tools: `read`, `bash`, `edit`, and `write`. It also sends execution context containing the remaining steps and critical files.

## Progress Tracking

During execution, the agent marks step completion by including `[DONE:n]`, where `n` is the plan step number. The extension scans assistant responses, marks matching steps done, and shows progress in the status widget. When every step is done, it posts a completion summary, clears execution state, and keeps normal tool access.

State is persisted in the session. When a session resumes, the extension reads the stored plan-mode state and rescans messages after the latest execution marker to rebuild completion status.

## Bash Policy

Allowed read-only command families include file inspection (`cat`, `head`, `tail`, `less`, `more`), search (`grep`, `rg`, `find`, `fd`), directory inspection (`ls`, `pwd`, `tree`), git reads (`git status`, `git log`, `git diff`, `git branch`), package inspection (`npm list`, `npm outdated`, `yarn info`), system info (`uname`, `whoami`, `date`, `uptime`), text processing (`wc`, `sort`, `uniq`, `diff`), and network fetches (`curl`, `wget`).

Blocked command families include file changes (`rm`, `mv`, `cp`, `mkdir`, `touch`, `chmod`), git writes (`git add`, `git commit`, `git push`, `git pull`), package installs (`npm install`, `yarn add`, `pip install`), system changes (`sudo`, `kill`, `reboot`, `shutdown`), and editors (`vim`, `nano`, `code`, `emacs`).
