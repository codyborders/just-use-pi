---
name: auditing-skill-security
description: Audit AI agent skills for security vulnerabilities. Use for security check, prompt injection scan, secret scanning, vulnerability audit, skill review, code security analysis. Triggers on "audit skill", "scan skill", "security check", "prompt injection", "check skill safety", "review skill security".
---

# Auditing Skill Security

Use the `skill-audit` CLI to find prompt injection, hardcoded secrets, unsafe shell code, and other security defects in agent skills.

## Quick Start

```bash
skill-audit audit /path/to/skill/
skill-audit audit-all
skill-audit audit-all --path ~/my-skills --path /opt/skills
skill-audit check-tools
```

## Audit Workflow

First, confirm that the CLI is available:

```bash
which skill-audit || pip install skill-audit
```

Then inspect the available scanners:

```bash
skill-audit check-tools
```

| Scanner | Availability | Purpose |
|---------|--------------|---------|
| `prompt` | Built in | Detect prompt injection and jailbreak patterns |
| `secrets` | Requires TruffleHog or Gitleaks | Find hardcoded credentials |
| `shellcheck` | Requires ShellCheck | Analyze shell scripts |
| `semgrep` | Requires Semgrep | Analyze code in supported languages |

Run the command that matches the requested scope:

```bash
# One skill
skill-audit audit /path/to/skill/

# Every discovered skill plus a custom directory
skill-audit audit-all --path ~/custom-skills

# Treat warnings as failures
skill-audit audit /path/to/skill/ --strict

# Machine-readable output
skill-audit audit /path/to/skill/ --format json
skill-audit audit /path/to/skill/ --format sarif -o results.sarif
```

## Output Examples

A clean result looks like this:

```text
Audit Results: /path/to/skills/calculator/
  prompt: passed [2 file(s)]
PASSED - No errors found
```

A failed result identifies the scanner, severity, and source location:

```text
Audit Results: /path/to/skills/suspicious/
  prompt: 2 finding(s) [3 file(s)]

| Severity | Scanner | Message                              | Location    |
|----------|---------|--------------------------------------|-------------|
| ERROR    | prompt  | Attempts to override previous instrs | SKILL.md:15 |

FAILED - 1 error(s)
```

A repository-wide scan summarizes each skill:

```text
skill-audit audit-all

Scanning skill directories...
  ~/.claude/skills/ (3 skills)
  ~/.claude/plugins/ (12 skills)

Results:
  [PASS] calculator
  [PASS] pdf-tools
  [PASS] git-helper
  [FAIL] suspicious-skill - 1 error(s)
  [PASS] ...

Summary: 14/15 skills passed, 1 failed
```

## Interpreting Results

| Exit code | Meaning |
|-----------|---------|
| `0` | No errors found |
| `1` | Security errors found |
| `2` | Scanner execution failed |

| Severity | Required response |
|----------|-------------------|
| `ERROR` | Block installation |
| `WARNING` | Review manually |
| `INFO` | Record as low-risk context |

## Optional Scanner Installation

On macOS:

```bash
brew install shellcheck semgrep trufflehog
```

On Linux:

```bash
pip install semgrep
sudo apt install shellcheck
```

## Limitations

Static analysis cannot reliably detect obfuscated malware, novel attacks, or runtime-only behavior. A passing result reduces known risk but does not establish that a skill is safe.
