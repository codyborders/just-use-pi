/**
 * Covers enforcement orchestration by exercising scope, shell blocking, Probity decisions, disabled state, and fail-closed errors.
 */

import type { ExtensionContext, ToolCallEvent } from "@earendil-works/pi-coding-agent";
import type { RuleResult } from "@nizos/probity/rules";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { guardToolCall, type WriteEvaluator } from "../src/guard-engine.js";

const context = {} as ExtensionContext;

test("blocks a behavior-code write when Probity reports a violation", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-engine-"));
  const evaluate: WriteEvaluator = async (): Promise<RuleResult> => ({
    kind: "violation",
    reason: "No failing test was observed.",
  });

  const result = await guardToolCall(
    writeEvent("src/value.ts", "export const value = 1;\n"),
    context,
    { active: true },
    root,
    evaluate,
  );

  assert.deepEqual(result, { block: true, reason: "No failing test was observed." });
});

test("allows a behavior-code write when Probity passes it", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-engine-"));
  const evaluate: WriteEvaluator = async (): Promise<RuleResult> => ({ kind: "pass" });

  const result = await guardToolCall(
    writeEvent("src/value.ts", "export const value = 1;\n"),
    context,
    { active: true },
    root,
    evaluate,
  );

  assert.equal(result, undefined);
});

test("does not call Probity for prose and configuration writes", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-engine-"));
  let calls = 0;
  const evaluate: WriteEvaluator = async (): Promise<RuleResult> => {
    calls += 1;
    return { kind: "violation", reason: "unexpected" };
  };

  const result = await guardToolCall(
    writeEvent("README.md", "Documentation\n"),
    context,
    { active: true },
    root,
    evaluate,
  );

  assert.equal(result, undefined);
  assert.equal(calls, 0);
});

test("disabled guard allows source writes without validation", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-engine-"));
  let calls = 0;
  const evaluate: WriteEvaluator = async (): Promise<RuleResult> => {
    calls += 1;
    return { kind: "violation", reason: "unexpected" };
  };

  const result = await guardToolCall(
    writeEvent("src/value.ts", "export const value = 1;\n"),
    context,
    { active: false },
    root,
    evaluate,
  );

  assert.equal(result, undefined);
  assert.equal(calls, 0);
});

test("blocks obvious shell-based source mutation", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-engine-"));
  const evaluate: WriteEvaluator = async (): Promise<RuleResult> => ({ kind: "pass" });
  const event = {
    type: "tool_call",
    toolCallId: "call-1",
    toolName: "bash",
    input: { command: "cat /tmp/value > src/value.ts" },
  } as ToolCallEvent;

  const result = await guardToolCall(event, context, { active: true }, root, evaluate);

  assert.equal(result?.block, true);
  assert.match(result?.reason ?? "", /edit or write tool/);
});

test("fails closed when the validator cannot complete", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-engine-"));
  const evaluate: WriteEvaluator = async (): Promise<RuleResult> => {
    throw new Error("model unavailable");
  };

  const result = await guardToolCall(
    writeEvent("src/value.ts", "export const value = 1;\n"),
    context,
    { active: true },
    root,
    evaluate,
  );

  assert.equal(result?.block, true);
  assert.match(result?.reason ?? "", /model unavailable/);
});

function writeEvent(path: string, content: string): ToolCallEvent {
  return {
    type: "tool_call",
    toolCallId: "call-1",
    toolName: "write",
    input: { path, content },
  } as ToolCallEvent;
}
