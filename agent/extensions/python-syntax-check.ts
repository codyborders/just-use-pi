/**
 * Python syntax check extension.
 *
 * After a `.py` file is written via the write tool, runs
 * `python -m py_compile` to catch syntax errors immediately.
 * Appends the error to the tool result so the LLM sees it
 * and can fix the file in the same turn.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("tool_result", async (event) => {
    if (event.toolName !== "write") {
      return undefined;
    }
    const filePath = (event.input.path || event.input.file_path) as string | undefined;
    if (!filePath) {
      return undefined;
    }
    if (!filePath.endsWith(".py")) {
      return undefined;
    }
    const result = await pi.exec("python", ["-m", "py_compile", filePath], {
      timeout: 10000,
    });
    if (result.code !== 0) {
      const errorText = (result.stderr || result.stdout).trim();
      return {
        content: [
          ...event.content,
          {
            type: "text" as const,
            text: `\nSyntax check FAILED for ${filePath}:\n${errorText}`,
          },
        ],
      };
    }
    return undefined;
  });
}
