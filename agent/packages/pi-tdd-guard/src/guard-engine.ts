import type {
  ExtensionContext,
  ToolCallEvent,
  ToolCallEventResult,
} from "@earendil-works/pi-coding-agent";
import type { RuleResult } from "@nizos/probity/rules";
import type { Action } from "@nizos/probity/types";
import { isAbsolute, resolve } from "node:path";

import { toPendingWrite } from "./action-adapter.js";
import { isBehaviorCodePath } from "./path-policy.js";
import { shellMutationReason } from "./shell-guard.js";

export type GuardState = Readonly<{ active: boolean }>;
export type WriteEvaluator = (
  action: Extract<Action, { kind: "write" }>,
  context: ExtensionContext,
) => Promise<RuleResult>;

export async function guardToolCall(
  event: ToolCallEvent,
  context: ExtensionContext,
  state: GuardState,
  cwd: string,
  evaluateWrite: WriteEvaluator,
): Promise<ToolCallEventResult | undefined> {
  if (!state.active) {
    return undefined;
  }

  if (event.toolName === "bash") {
    const command = event.input.command;
    if (typeof command !== "string") {
      return { block: true, reason: "TDD Guard received a malformed bash command." };
    }
    const reason = shellMutationReason(command);
    return reason === undefined ? undefined : { block: true, reason };
  }

  if (event.toolName !== "write" && event.toolName !== "edit") {
    return undefined;
  }

  const filePath = event.input.path;
  if (typeof filePath !== "string" || filePath.length === 0) {
    return { block: true, reason: "TDD Guard received a source write without a path." };
  }
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(cwd, filePath);
  if (!isBehaviorCodePath(absolutePath)) {
    return undefined;
  }

  const pending = await toPendingWrite(
    { toolName: event.toolName, input: event.input },
    cwd,
  );
  if (!pending.ok) {
    return { block: true, reason: pending.reason };
  }

  try {
    const result = await evaluateWrite(pending.action, context);
    if (result.kind === "pass") {
      return undefined;
    }
    if (result.kind === "violation" && result.reason.trim().length > 0) {
      return { block: true, reason: result.reason };
    }
    return { block: true, reason: "TDD Guard received an invalid result from Probity." };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      block: true,
      reason: `TDD Guard failed closed because validation could not complete: ${message}`,
    };
  }
}
