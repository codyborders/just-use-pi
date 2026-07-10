# Pi TDD Guard

Pi TDD Guard combines a TDD skill with tool-boundary enforcement powered by [Probity](https://github.com/nizos/probity).

## Behavior

The package injects concise workflow guidance while enforcement is active. Before Pi writes behavior code, Probity receives the pending content plus recent prompts and tool results. Prose, configuration, dependencies, generated output, and build artifacts remain outside enforcement. Common shell mutation forms are blocked, and validator failures stop the write.

Probity uses `openai-codex/gpt-5.4-mini` for validation when that model is available and authenticated. Otherwise, it uses the active Pi model.

## Commands

- `/tdd` or `/tdd status` reports session state.
- `/tdd on` enables enforcement for the session.
- `/tdd off` disables enforcement for the session.

State is stored in branch-aware Pi session entries. New sessions default to enforcement on.

## Enforcement boundary

The extension blocks direct source writes made through Pi's `edit` and `write` tools when Probity finds a TDD violation. It also blocks common shell mutation forms such as source redirection, in-place editors, patch application, inline file-writing scripts, and source-targeting copy, move, remove, or restore commands.

The guard operates at Pi's tool boundary. It does not provide operating-system isolation, so an intentionally obfuscated shell program can still mutate files. Closing that gap requires a filesystem sandbox that prevents source writes while retaining the runtime directories tests need.

## Development

```sh
npm install
npm run check
```
