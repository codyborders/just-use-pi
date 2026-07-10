---
name: websearch
description: >
  Search the web for information using Exa AI. Use when researching topics, looking up current information,
  or gathering links and summaries. Triggers: "search", "find online", "research", "look up", "web search".
---

# websearch skill

Search the web through Pi's `websearch` tool, backed by Exa AI.

## When to use

- Researching current topics online
- Looking up information that may have changed recently
- Gathering links and summaries before deeper browsing

## Parameters

- `query` (required): Search query text
- `numResults`: Result count from `1` to `10`, default `8`
- `livecrawl`: `fallback` (default) or `preferred`
- `type`: `auto` (default), `fast`, or `deep`
- `contextMaxCharacters`: Context size from `1000` to `50000`, default `10000`
- `timeoutSeconds`: Request timeout in seconds, from `1` to `120`

## Implementation

- The implementation is provided by `agent/extensions/web-tools.ts`.
- The search backend is Exa AI.

## Example usage

```
Search the web for "latest Python 3.12 features"
Use numResults 5 and type fast
```
