---
name: webfetch
description: >
  Fetch web content from HTTP or HTTPS URLs. Use when reading documentation, articles, or any web page content.
  Triggers: "fetch", "scrape", "get content from", "read the page at", webfetch.
---

# webfetch skill

Fetch web content from HTTP or HTTPS URLs through Pi's `webfetch` tool.

## When to use

- Reading docs and articles from normal web pages
- Pulling content from authenticated pages you personally access
- Capturing raw HTML when you need to inspect the source response

## Parameters

- `url` (required): The page URL
- `format`: `markdown` (default), `text`, or `html`
- `timeoutSeconds`: Request timeout in seconds, from `1` to `120`
- `cookies`: Optional cookies as JSON object text or `name=value; other=value`

## Notes

- The implementation is provided by `agent/extensions/web-tools.ts`.
- Cookie support is intended for local authenticated sessions you control.
- This tool fetches server responses directly. JavaScript-rendered pages will often return incomplete content here.

## Example usage

```
Use the webfetch tool for https://example.com/docs
Use format markdown and timeoutSeconds 30
```

## Cookie examples

```
cookies: "{\"session\":\"abc123\",\"theme\":\"dark\"}"
cookies: "session=abc123; theme=dark"
```
