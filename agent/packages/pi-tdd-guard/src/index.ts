import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

import { guardToolCall, type GuardState, type WriteEvaluator } from "./guard-engine.js";
import { GUARD_STATE_ENTRY, loadGuardState } from "./guard-state.js";
import { createProbityWriteEvaluator } from "./probity-evaluator.js";
import { ACTIVE_GUARD_PROMPT } from "./tdd-policy.js";

const STATUS_KEY = "pi-tdd-guard";

export function registerTddGuard(
  pi: ExtensionAPI,
  evaluateWrite: WriteEvaluator = createProbityWriteEvaluator(),
): void {
  let state: GuardState = { active: true };

  const updateStatus = (context: ExtensionContext): void => {
    context.ui.setStatus(STATUS_KEY, state.active ? "TDD: on" : "TDD: off");
  };

  const restoreState = (context: ExtensionContext): void => {
    state = loadGuardState(context.sessionManager.getBranch());
    updateStatus(context);
  };

  pi.on("session_start", (_event, context) => {
    restoreState(context);
  });

  pi.on("session_tree", (_event, context) => {
    restoreState(context);
  });

  pi.on("before_agent_start", (event) => {
    if (!state.active) {
      return undefined;
    }
    return {
      systemPrompt: `${event.systemPrompt}\n\n## TDD Enforcement\n\n${ACTIVE_GUARD_PROMPT}`,
    };
  });

  pi.on("tool_call", async (event, context) =>
    guardToolCall(event, context, state, context.cwd, evaluateWrite),
  );

  pi.registerCommand("tdd", {
    description: "Show, enable, or disable TDD Guard for this session",
    handler: async (args, context) => {
      const command = args.trim().toLowerCase();
      if (command.length === 0 || command === "status") {
        context.ui.notify(`TDD Guard is ${state.active ? "on" : "off"}.`, "info");
        return;
      }
      if (command !== "on" && command !== "off") {
        context.ui.notify("Usage: /tdd [status|on|off]", "error");
        return;
      }

      state = { active: command === "on" };
      pi.appendEntry(GUARD_STATE_ENTRY, state);
      updateStatus(context);
      context.ui.notify(`TDD Guard turned ${state.active ? "on" : "off"}.`, "info");
    },
  });
}

export default function tddGuardExtension(pi: ExtensionAPI): void {
  registerTddGuard(pi);
}
