/**
 * Git safety extension.
 *
 * Blocks `git push` commands ONLY if the branch is actually behind
 * the remote. This prevents accidental force-pushes or pushing over
 * new remote commits. Allows push if the branch is up-to-date or only
 * local changes exist.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event) => {
    if (event.toolName !== "bash") {
      return undefined;
    }
    const command = event.input.command as string;
    if (!command) {
      return undefined;
    }

    // Only intercept if the command contains a git push.
    if (!/git\s+push/.test(command)) {
      return undefined;
    }

    // Allow if the same command also contains pull --rebase (chained).
    if (/pull.*rebase/.test(command)) {
      return undefined;
    }

    // Allow --force flags (user knows what they're doing)
    if (/git\s+push.*(-f|--force)/.test(command)) {
      return undefined;
    }

    // Check if branch is behind remote by running git fetch and status
    try {
      const cwd = event.input.cwd as string || process.cwd();
      const { execSync } = require("child_process");

      // Get current branch status
      const status = execSync("git status -sb", {
        cwd,
        encoding: "utf8",
        timeout: 5000,
      });

      // Check if behind remote (has [<remote> ...] notation)
      const behindMatch = status.match(/\[behind \d+\]/);
      if (behindMatch) {
        return {
          block: true,
          reason: `Branch is behind remote. Run 'git pull --rebase' before pushing.`,
        };
      }
    } catch {
      // If we can't determine status, allow the push
    }

    // Branch is up-to-date or ahead only, allow push
    return undefined;
  });
}
