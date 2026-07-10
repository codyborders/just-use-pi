---
name: surf
description: Control Chrome through the surf CLI for browser testing, screenshots, form filling, page inspection, network and CPU emulation, DevTools data, and AI sites that use your logged-in Chrome session.
---

# Surf Browser Automation

`surf` gives agents a real Chrome session. Use it when shell-only checks cannot prove browser behavior: page state, clicks, forms, screenshots, console output, network requests, viewport changes, or AI sites that require your logged-in Chrome profile.

When command syntax is uncertain, ask the CLI first.

```bash
surf --help
surf <group>
surf --help-full
surf --find <term>
surf --help-topic <topic>
```

## First pass on a page

```bash
surf navigate "https://example.com"
surf page.read
surf page.read --compact
surf page.state
surf screenshot --output /tmp/shot.png
```

Read the page before clicking. Refs from `page.read` usually survive markup churn better than CSS selectors. Semantic locators work well when the intent is visible in the UI.

```bash
surf click --ref e1
surf locate.role button --name "Submit" --action click
surf locate.label "Email" --action fill --value "test@example.com"
surf locate.text "Accept" --exact --action click
```

## Browser targets

```bash
surf tab.list
surf tab.new "https://google.com"
surf tab.switch 12345
surf tab.name myapp
surf tab.switch myapp
surf tab.close 12345

surf window.list --tabs
surf window.new "https://example.com"
surf --window-id 123 page.read
surf window.focus 12345
surf window.resize --id 123 --width 1920 --height 1080
```

Use a separate window when agent work should not disturb your normal tabs.

## Read, act, wait

```bash
surf page.text
surf page.read --ref e5
surf element.styles e5
surf element.styles ".card"

surf click --x 100 --y 200
surf click --ref e5
surf type --text "hello"
surf type --text "hello" --selector "#input" --method js
surf key Enter
surf key "cmd+a"
surf hover --ref e5
surf drag --from-x 100 --from-y 100 --to-x 200 --to-y 200

surf scroll.bottom
surf scroll.to --ref e5
surf scroll.by --y 200
surf scroll.info

surf wait 2
surf wait.element ".loaded"
surf wait.network
surf wait.url "/success"
surf wait.dom --stable 100
surf wait.load
```

Use `--method js` when CDP typing fails in rich text editors.

## Forms and embedded contexts

```bash
surf form.fill --data '[{"ref":"e1","value":"John"},{"ref":"e2","value":"john@example.com"}]'
surf select e5 "Option A"
surf select e5 --by label "Display Text"
surf upload --ref e5 --files "/path/to/file.txt"

surf frame.list
surf frame.switch "FRAME_ID"
surf frame.main
surf frame.js --id "FRAME_ID" --code "return document.title"

surf dialog.info
surf dialog.accept
surf dialog.accept --text "response"
surf dialog.dismiss
```

Switch into an iframe before reading or acting on elements inside it.

## Evidence and diagnostics

```bash
surf screenshot
surf screenshot --output /tmp/shot.png
surf screenshot --selector ".card"
surf screenshot --full-page

surf console
surf console --stream --level error
surf network
surf network --stream
surf network.get --id "req-123"
surf network.body --id "req-123"
surf network.curl --id "req-123"
surf network.export

surf perf.metrics
surf perf.start
surf perf.stop
surf wait.element ".missing" --auto-capture --timeout 2000
```

`--auto-capture` saves the screenshot and console snapshot needed to debug failed waits.

## Emulation and stored browser state

```bash
surf emulate.network slow-3g
surf emulate.network reset
surf emulate.cpu 4
surf emulate.cpu 1
surf emulate.device "iPhone 14"
surf emulate.device --list
surf emulate.viewport --width 1280 --height 720
surf emulate.touch --enable
surf emulate.geo --lat 37.7749 --lon -122.4194
surf emulate.geo --clear

surf zoom
surf zoom 1.5
surf zoom 1
surf cookie.list
surf cookie.get --name "token"
surf cookie.clear
surf history --query "github" --max 20
surf bookmarks --query "docs"
surf bookmark.add --url "https://..." --title "My Bookmark"
```

After tests, restore network throttling; clear device settings; remove any location override; reset zoom.

## AI sites through Chrome

These commands rely on your logged-in Chrome profile. No API key is involved.

```bash
surf chatgpt "explain this code"
surf chatgpt "review" --with-page --model gpt-4o
surf chatgpt "analyze" --file document.pdf

surf gemini "summarize" --with-page
surf gemini "analyze" --file data.csv
surf gemini "a robot surfing" --generate-image /tmp/robot.png
surf gemini "hello" --model gemini-2.5-flash

surf perplexity "latest news" --model sonar
surf perplexity "deep dive" --mode research

surf grok "find viral AI posts" --deep-search
surf grok --validate
surf grok --validate --save-models

surf aistudio "redteam this" --with-page
surf aistudio "quick answer" --model gemini-3-flash-preview
surf aistudio.build "build a portfolio site" --output ./out
```

On failure, check login state, validate the UI, increase timeout for thinking models, then retry with a model name from validation output.

## Multi-step scripts

`surf do` runs a browser flow as one command, with automatic waits after page loads, clicks, keys, form fills, and tab switches.

```bash
surf do 'go "https://example.com" | click e5 | screenshot'
surf do 'go "https://example.com/login" | type "user@example.com" --selector "#email" | type "pass" --selector "#password" | click --selector "button[type=submit]"'
surf do 'go "https://example.test" | page.read' --dry-run
```

Named workflows live in `~/.surf/workflows/` or `./.surf/workflows/`.

```bash
surf workflow.list
surf workflow.info my-workflow
surf do my-workflow --email "user@example.com" --password "secret"
surf workflow.validate workflow.json
```

Workflow files can store step output, loop a fixed number of times, iterate over data, or stop when a condition passes.

```json
{
  "steps": [
    { "tool": "js", "args": { "code": "return [1,2,3]" }, "as": "items" },
    { "repeat": 5, "steps": [{ "tool": "click", "args": { "ref": "e5" } }] },
    { "each": "%{items}", "as": "item", "steps": [
      { "tool": "js", "args": { "code": "console.log('%{item}');" } }
    ]}
  ]
}
```

```bash
surf do my-workflow --file workflow.json --json
surf do 'go "https://example.org" | screenshot' --on-error stop --step-delay 100
surf do 'go "https://example.net" | wait.load' --no-auto-wait
```

## Common options

```bash
--tab-id <id>
--window-id <id>
--json
--auto-capture
--timeout <ms>
```

## Socket API

Send a JSON tool request to the Unix socket when another process needs direct access.

```bash
echo '{"type":"tool_request","method":"execute_tool","params":{"tool":"tab.list","args":{}},"id":"1"}' | nc -U /tmp/surf.sock
```
