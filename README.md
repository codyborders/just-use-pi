# just-use-pi

An opinionated global configuration for [Pi](https://pi.dev), built around direct execution, code review, test-first changes, and reusable skills.

This repository distributes configuration for Pi. It does not modify Pi source. The `agent/` directory contains global instructions, extensions, skills, presets, package settings, and a local TDD guard package.

## Requirements

Setup requires Pi, Git, and Node.js 22 or newer. Install Pi with npm:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

## Setup

Clone the repository and install the local package dependencies:

```bash
git clone https://github.com/codyborders/just-use-pi.git
cd just-use-pi
npm ci --ignore-scripts --prefix agent/packages/pi-tdd-guard
```

Point Pi at the included configuration directory:

```bash
PI_CODING_AGENT_DIR="$PWD/agent" pi
```

Use `/login` inside Pi to authenticate. Pi writes authentication data to `agent/auth.json`, which Git ignores.

Set `PI_CODING_AGENT_DIR` in your shell environment to load this configuration by default. Keep its value pointed at this repository's `agent/` directory.

## Repository Layout

| Path | Purpose |
|------|---------|
| `agent/AGENTS.md` | Global coding and workflow rules |
| `agent/settings.json` | Package selection, default model, and Pi behavior |
| `agent/extensions/` | Tools and workflow controls |
| `agent/skills/` | Reusable task and review instructions |
| `agent/packages/pi-tdd-guard/` | Test-first enforcement for behavior-bearing code |
| `agent/presets.json` | Reusable model and tool presets |
| `agent/models.json.example` | Credential-free custom model example |

Review `agent/settings.json` before first use. Package extensions execute with your user permissions. Skills can direct an agent to run commands.

## Personalization

Change the default provider and model in `agent/settings.json`, or select one from Pi with `/model`.

For custom model definitions, copy `agent/models.json.example` to `agent/models.json` and edit the ignored copy. Keep API keys in environment variables or Pi's authentication store.

Edit `agent/AGENTS.md` to match your workflow. Global instruction changes affect every Pi session and deserve the same review as code changes.

## Privacy

The public tree omits authentication data, model credentials, session transcripts, Entire checkpoints, trust decisions, session-manager state, favorites, machine-specific hooks, local paths, and captured provider payloads.

Ignore rules cover known runtime paths. Check staged files before every commit, especially after adding an extension that writes logs or captures requests. Publish session data only when every participant and data owner has approved its release.

## Verification

Run the package checks after changing the TDD guard:

```bash
npm run check --prefix agent/packages/pi-tdd-guard
```

See [SECURITY.md](SECURITY.md) for private vulnerability reporting and repository security boundaries.

## License

Original work is available under the [MIT License](LICENSE). Adapted material and upstream attribution are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
