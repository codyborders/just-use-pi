/**
 * Pre-commit test runner extension.
 *
 * Intercepts `git commit` commands and runs the pytest suite first.
 * Blocks the commit if any tests fail, giving the agent a chance
 * to fix the failures before retrying.
 *
 * Only runs if the current directory has pytest config.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync } from "node:fs";
import { statSync } from "node:fs";

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "bash") return undefined;
    const command = event.input.command as string;
    if (!/git\s+commit/.test(command)) return undefined;

    const cwd = ctx.cwd;
    const hasPytestConfig = existsSync(`${cwd}/pytest.ini`) ||
                           existsSync(`${cwd}/pyproject.toml`) ||
                           existsSync(`${cwd}/setup.cfg`) ||
                           (existsSync(`${cwd}/tests`) && statSync(`${cwd}/tests`).isDirectory()) ||
                           (existsSync(`${cwd}/test`) && statSync(`${cwd}/test`).isDirectory());

    if (!hasPytestConfig) return undefined;

    const result = await pi.exec("python", ["-m", "pytest", "--tb=short", "-q"], { cwd, timeout: 60000 });
    if (result.code !== 0) {
      const tail = result.stdout.split("\n").slice(-20).join("\n");
      return { block: true, reason: `Tests failed. Fix before committing.\n\n${tail}` };
    }
    return undefined;
  });
}
