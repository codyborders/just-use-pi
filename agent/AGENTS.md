# General Rules

Never use emoji. Never tell the user to run commands; run them yourself and report the result. For example, do not say: "Spin up uvicorn with `uvicorn server:app --host 0.0.0.0 --port 8014`." Start the server yourself.

Store secrets in `.env`, and check whether `.env` already exists before creating one. Follow `PYTHON.md` for Python work. Use a virtual environment before running any Python app.

# Style Guide

## Zero Technical Debt

Do the work correctly the first time. Shipped code may lack features, but existing behavior must meet the project bar. Do not leave TODOs, placeholder code, or temporary shortcuts. If work cannot be done now, open an issue instead of leaving a comment that nobody will act on.

## Assertions and Defensive Checks

Assertions are part of the design. Validate data at function boundaries with `assert`, `ValueError`, or `TypeError`. Use `assert` for programmer errors. Use explicit exceptions for user input and external input.

Pair checks across more than one code path. Validate data before writing it to a store, then validate it again after reading it back. Check what must be true. Also check what must not be true. Bugs often sit on the boundary between valid and invalid states.

Aim for at least two assertions or defensive checks per function. If a function has none, confirm that it only wires calls together or delegates work.

## Simple, Explicit Control Flow

Use direct control flow and extract helpers before nesting becomes hard to follow. Split compound boolean conditions into separate branches when each case needs to be obvious. Avoid `if a and b and c:` when the reader cannot verify each path quickly.

When a branch has only an `if`, ask whether an `else` should document the other path. State invariants in positive form. Prefer `if index < length:` over negated boundary checks. Keep function bodies near 50 lines because longer functions usually hold more than one responsibility.

## Naming

Names should give the reader the right mental model. Use exact nouns and verbs. Do not accept the first name that comes to mind if it hides intent.

Do not abbreviate. Prefer full names such as `source`, `target`, and `message_count` over shortened forms such as `src`, `dst`, and `msg_cnt`. Put units and qualifiers after the main noun, such as `latency_ms_max` rather than `max_latency_ms`, so related names sort together.

Prefer paired names with similar length when possible, such as `source` and `target`. Do not reuse a term with different meanings across subsystems.

## Comments and Documentation

Comments should explain why a choice exists. Explain non-obvious decisions so the reader can judge the tradeoff. Put a short description at the top of each test file that states the covered behavior and the check method. Write comments as complete sentences. Inline comments may be brief when they label a line.

## Error Handling

Handle every signaled error. Do not use bare `except:`. Do not use `except Exception:` unless the handler logs and raises, converts to a meaningful domain error, or handles the failure completely. Trace each failure path. If a function can fail, the caller must deal with that failure explicitly.

## Scope and State

Keep state small and local. Declare variables close to first use. Do not duplicate state that can drift from its source. Keep few variables alive at once so misuse is easier to spot.

## Explicit Over Implicit

Spell out options at call sites when defaults affect behavior. Be explicit about encoding, timeouts, sort order, and other settings where a library default could change or hide intent.

## Commit Messages

Write commit messages that explain what changed and why. The message should help future readers understand the decision without reopening the whole diff.

## Deployment

Do not deploy unless the user explicitly requests it and confirms the target. State the planned target and rollback path before changing a live service.

## Git Workflow

Do not commit or push unless the user explicitly requests it. Before pushing, pull with rebase and resolve any conflicts without discarding unrelated work.

## Subagents

Do not use subagents for review workflows. Use review skills and their extension commands instead.

If a legacy workflow still spawns a subagent, verify that it has the needed permissions and tool access before starting it. If it fails, take over the work yourself instead of retrying.

Subagents live in `~/.pi/agent/agents/` as `.md` files with YAML frontmatter. The remaining project-local agents are for older scout/planner/reviewer/worker workflows.

## Testing

My main stack is Python backends with static HTML and JSON/YAML configuration. When adding functionality, update expected counts in tests, such as tool counts or test counts. After code changes, run the full test suite before committing.

## Web Research

When I ask you to research or scrape a website, use search tools first. Do not scrape JavaScript-rendered pages with WebFetch because it will not work. If a page cannot be fetched, say so immediately so I can provide the content.

## Conditional Skills

When work involves Python code, Python tooling, or Python project files, read and follow the `python-practices` skill before changing files.
