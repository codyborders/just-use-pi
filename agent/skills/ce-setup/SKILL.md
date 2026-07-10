---
name: ce-setup
description: "Diagnose and configure compound-engineering environment. Checks CLI dependencies, plugin version, and repo-local config. Offers guided installation for missing tools. Use when troubleshooting missing tools, verifying setup, or before onboarding."
disable-model-invocation: true
---

# Compound Engineering Setup

## Interaction Method

Ask each question with the platform's blocking question tool, such as `ask_user_question` in Claude Code, `request_user_input` in Codex, or `ask_user` in Gemini. If no structured question tool exists, present the question as a numbered list and wait for a reply before moving on. For multiSelect questions, accept comma-separated numbers such as `1, 3`. Never skip prompts or configure anything without approval.

This setup checks the compound-engineering environment, removes obsolete repo-local CE config when the user approves, and helps install required tools. `ce:review` handles review-agent selection automatically. Put project-specific review guidance in `CLAUDE.md` or `AGENTS.md`.

## Phase 1: Diagnose

### Step 1: Determine Plugin Version

Detect the installed compound-engineering plugin version from plugin metadata or a manifest. Use the lookup available on the current platform, such as reading `plugin.json` from the plugin root or cache directory. If the version cannot be found, skip this step.

If a version is found, pass it to the check script with `--version`. Otherwise omit the flag.

### Step 2: Run the Health Check Script

Before running the script, display: "Compound Engineering: checking your environment..."

Run the bundled check script. Do not perform manual dependency checks. The script handles CLI tools, repo-local CE file checks, and `.gitignore` guidance in one pass.

```bash
bash scripts/check-health --version VERSION
```

Run without `--version` when Step 1 cannot determine it:

```bash
bash scripts/check-health
```

Script reference: `scripts/check-health`

Display the script output to the user.

### Step 3: Evaluate Results

Determine whether this session is running in Claude Code:

```bash
[ -n "${CLAUDE_PLUGIN_ROOT}" ] && echo "CLAUDE_CODE" || echo "OTHER"
```

If the command resolves to `CLAUDE_CODE`, `/ce-update` is available. Otherwise, omit `/ce-update` from all output.

After the diagnostic report, check for these conditions:

- Missing dependencies reported in yellow by the script.
- `compound-engineering.local.md` exists and needs cleanup.
- `.compound-engineering/config.local.yaml` is absent or not safely gitignored.
- `.compound-engineering/config.local.example.yaml` is absent or outdated.

When everything is installed, no repo-local cleanup is needed, and `.compound-engineering/config.local.yaml` exists with gitignore coverage, show the tool list and completion message. Parse tool names from the script output and list each as installed.

```text
[OK] Compound Engineering setup complete

     Tools: [installed] agent-browser  [installed] gh  [installed] jq  [installed] vhs  [installed] silicon  [installed] ffmpeg
     Config: [OK]

     Run /ce-setup anytime to re-check.
```

For Claude Code sessions, add: "Run /ce-update to grab the latest plugin version."

Stop here when the setup is complete. If issues remain, proceed to Phase 2. Resolve repo-local cleanup first, then config bootstrapping, then missing dependencies.

## Phase 2: Fix

### Step 4: Resolve Repo-Local CE Issues

Resolve the repository root with `git rev-parse --show-toplevel`. If `compound-engineering.local.md` exists there, explain that it is obsolete because review-agent selection is automatic and CE stores surviving machine-local state in `.compound-engineering/config.local.yaml`. Ask whether to delete the obsolete file. Use the repo-root path when deleting.

### Step 5: Bootstrap Project Config

Resolve the repository root with `git rev-parse --show-toplevel`. Treat every path below as relative to that root.

Refresh the example config on every run. Copy `references/config-template.yaml` to `<repo-root>/.compound-engineering/config.local.example.yaml`, creating the directory if needed. Commit this file to the repo. Always overwrite it with the latest template so teammates can see current settings.

Create the local config only when it is missing. If `.compound-engineering/config.local.yaml` does not exist, ask:

```text
Set up a local config file for this project?
This saves your Compound Engineering preferences, including tool choices and workflow behavior.
Everything starts commented out; enable only the settings you need.

1. Yes, create it (Recommended)
2. No thanks
```

If the user approves, copy `references/config-template.yaml` to `<repo-root>/.compound-engineering/config.local.yaml`. If `.compound-engineering/config.local.yaml` is not already covered by `.gitignore`, offer to add this entry:

```text
.compound-engineering/*.local.yaml
```

If the local config already exists, check whether it is safely gitignored. If not, offer to add the same `.gitignore` entry.

### Step 6: Offer Installation

Present missing dependencies with a multiSelect question. Pre-select every missing item. Use install commands and URLs from the script diagnostic output.

```text
The following tools are missing. Select which to install:
(All items are pre-selected)

Recommended:
  [x] agent-browser - Browser automation for testing and screenshots
  [x] gh - GitHub CLI for issues and PRs
  [x] jq - JSON processor
  [x] vhs (charmbracelet/vhs) - Create GIFs from CLI output
  [x] silicon (Aloxaf/silicon) - Generate code screenshots
  [x] ffmpeg - Video processing for feature demos
```

Only show dependencies that are actually missing. Omit installed tools.

### Step 7: Install Selected Dependencies

For each selected dependency, follow this sequence:

1. Show the install command from the diagnostic output and ask for approval.

   ```text
   Install agent-browser?
   Command: CI=true npm install -g agent-browser --no-audit --no-fund --loglevel=error && agent-browser install && npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser -g -y

   1. Run this command
   2. Skip. I'll install it manually
   ```

2. If approved, run the install command with a shell execution tool.
3. After the command finishes, verify installation with the dependency's check command, such as `command -v agent-browser`.
4. If verification succeeds, report success.
5. If the install or verification fails, display the project URL as a fallback and continue to the next dependency.

### Step 8: Summary

Display a brief summary:

```text
[OK] Compound Engineering setup complete

     Installed: agent-browser, gh, jq
     Skipped:   none

     Run /ce-setup anytime to re-check.
```

For Claude Code sessions, add: "Run /ce-update to grab the latest plugin version."
