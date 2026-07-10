/**
 * Covers Pi extension wiring by exercising prompt injection, command-controlled state, persistence, and guarded tool dispatch.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { RuleResult } from "@nizos/probity/rules";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { registerTddGuard } from "../src/index.js";
import type { WriteEvaluator } from "../src/guard-engine.js";

type EventHandler = (event: any, context: ExtensionContext) => unknown | Promise<unknown>;
type Command = { handler: (args: string, context: ExtensionContext) => unknown | Promise<unknown> };

test("injects active workflow guidance and dispatches source writes to Probity", async () => {
  const harness = createHarness();
  let evaluations = 0;
  const evaluate: WriteEvaluator = async (): Promise<RuleResult> => {
    evaluations += 1;
    return { kind: "pass" };
  };
  registerTddGuard(harness.api, evaluate);
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-extension-"));
  const context = harness.context(root);

  await harness.invoke("session_start", { type: "session_start", reason: "startup" }, context);
  const promptResult = await harness.invoke(
    "before_agent_start",
    { type: "before_agent_start", systemPrompt: "Base prompt" },
    context,
  );
  const toolResult = await harness.invoke(
    "tool_call",
    {
      type: "tool_call",
      toolCallId: "call-1",
      toolName: "write",
      input: { path: "src/value.ts", content: "export const value = 1;\n" },
    },
    context,
  );

  assert.match((promptResult as { systemPrompt: string }).systemPrompt, /TDD Guard is active/);
  assert.equal(toolResult, undefined);
  assert.equal(evaluations, 1);
  assert.equal(harness.statuses.at(-1), "TDD: on");
});

test("restores guard state when Pi resumes a session", async () => {
  const harness = createHarness();
  const evaluate: WriteEvaluator = async (): Promise<RuleResult> => ({ kind: "pass" });
  registerTddGuard(harness.api, evaluate);
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-extension-"));
  const context = harness.context(root);
  harness.setBranch([
    { type: "custom", customType: "pi-tdd-guard-state", data: { active: false } },
  ]);

  await harness.invoke(
    "session_start",
    { type: "session_start", reason: "resume", previousSessionFile: "/tmp/old.jsonl" },
    context,
  );
  const promptResult = await harness.invoke(
    "before_agent_start",
    { type: "before_agent_start", systemPrompt: "Base prompt" },
    context,
  );

  assert.equal(promptResult, undefined);
  assert.equal(harness.statuses.at(-1), "TDD: off");
});

test("persists an explicit off command and stops intercepting writes", async () => {
  const harness = createHarness();
  let evaluations = 0;
  const evaluate: WriteEvaluator = async (): Promise<RuleResult> => {
    evaluations += 1;
    return { kind: "violation", reason: "unexpected" };
  };
  registerTddGuard(harness.api, evaluate);
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-extension-"));
  const context = harness.context(root);

  await harness.commands.get("tdd")?.handler("off", context);
  const result = await harness.invoke(
    "tool_call",
    {
      type: "tool_call",
      toolCallId: "call-1",
      toolName: "write",
      input: { path: "src/value.ts", content: "export const value = 1;\n" },
    },
    context,
  );

  assert.equal(result, undefined);
  assert.equal(evaluations, 0);
  assert.deepEqual(harness.entries, [
    { customType: "pi-tdd-guard-state", data: { active: false } },
  ]);
  assert.equal(harness.statuses.at(-1), "TDD: off");
});

function createHarness() {
  const handlers = new Map<string, EventHandler[]>();
  const commands = new Map<string, Command>();
  const entries: Array<{ customType: string; data: unknown }> = [];
  const statuses: string[] = [];
  const notifications: string[] = [];
  let branch: unknown[] = [];

  const api = {
    on: (eventName: string, handler: EventHandler) => {
      const registered = handlers.get(eventName) ?? [];
      registered.push(handler);
      handlers.set(eventName, registered);
    },
    registerCommand: (name: string, command: Command) => commands.set(name, command),
    appendEntry: (customType: string, data: unknown) => entries.push({ customType, data }),
  } as unknown as ExtensionAPI;

  return {
    api,
    commands,
    entries,
    statuses,
    context: (cwd: string) =>
      ({
        cwd,
        sessionManager: { getBranch: () => branch },
        ui: {
          setStatus: (_key: string, value: string) => statuses.push(value),
          notify: (message: string) => notifications.push(message),
        },
      }) as unknown as ExtensionContext,
    invoke: async (eventName: string, event: unknown, context: ExtensionContext) => {
      const registered = handlers.get(eventName) ?? [];
      assert.equal(registered.length, 1, `expected one ${eventName} handler`);
      return registered[0]?.(event, context);
    },
    setBranch: (entriesForBranch: unknown[]) => {
      branch = entriesForBranch;
    },
  };
}
