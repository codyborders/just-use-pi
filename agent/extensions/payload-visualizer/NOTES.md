# Payload Visualizer Notes

## 2026-04-28: File bloat caused slow pi startup

The old payload visualizer stored every captured provider request in `~/.pi/agent/payload-visualizer.jsonl`. That file grew to 4.1 GB.

`pi` runs startup migrations on every launch. One migration scans `~/.pi/agent/*.jsonl` for legacy session files and reads each matching file while it looks for a session record. The payload visualizer log lived at the agent root and used the `.jsonl` extension, so startup read the 4.1 GB payload log before the UI appeared.

The benchmark made the cause clear. With `~/.pi/agent/payload-visualizer.jsonl` present, `runMigrations` took 6812 ms and the full startup benchmark took 7959 ms. After deleting the stale payload log, `runMigrations` took 1 ms and the full startup benchmark took 1001 ms.

The current implementation avoids this path. Capture starts disabled. `/payload-visualizer` or `/payloads` enables capture for the current session only. Captured payloads stay in memory, with a cap of 100 entries. The extension does not read from or write to a payload log under `~/.pi/agent`. On session shutdown, capture stops, memory is cleared, and the server shuts down.

If persistent capture is added again, do not write large `.jsonl` files directly under `~/.pi/agent`. Use an extension-owned subdirectory, cap file size, and avoid startup reads of historical payload data.
