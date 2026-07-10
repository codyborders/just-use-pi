/**
 * Covers the Probity integration by verifying Pi history, current content, pending content, and package policy reach its validator agent.
 */

import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { Agent, Verdict } from "@nizos/probity/types";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createProbityWriteEvaluator } from "../src/probity-evaluator.js";

test("evaluates a pending write with normalized Pi session evidence", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-probity-"));
  const filePath = join(root, "src", "value.test.ts");
  await mkdir(join(root, "src"));
  await writeFile(filePath, "import { value } from './value.js';\n", { encoding: "utf8", flag: "wx" });

  let validatorPrompt = "";
  const agent: Agent = {
    reason: async (prompt: string): Promise<Verdict> => {
      validatorPrompt = prompt;
      return { kind: "violation", reason: "Test is tautological." };
    },
  };
  const context = {
    signal: undefined,
    sessionManager: {
      getBranch: () => [
        { type: "message", message: { role: "user", content: "Add value behavior" } },
        {
          type: "message",
          message: {
            role: "assistant",
            content: [
              {
                type: "toolCall",
                id: "call-1",
                name: "bash",
                arguments: { command: "npm test" },
              },
            ],
          },
        },
        {
          type: "message",
          message: {
            role: "toolResult",
            toolCallId: "call-1",
            toolName: "bash",
            content: [{ type: "text", text: "AssertionError: expected 1" }],
          },
        },
      ],
    },
  } as unknown as ExtensionContext;
  const evaluate = createProbityWriteEvaluator(() => agent);

  const result = await evaluate(
    {
      kind: "write",
      path: filePath,
      content:
        "import { value } from './value.js';\n\ntest('value', () => expect(value).toBe(value));\n",
    },
    context,
  );

  assert.deepEqual(result, { kind: "violation", reason: "Test is tautological." });
  assert.match(validatorPrompt, /Add value behavior/);
  assert.match(validatorPrompt, /AssertionError: expected 1/);
  assert.match(validatorPrompt, /Current file content/);
  assert.match(validatorPrompt, /import \{ value \}/);
  assert.match(validatorPrompt, /Pending action/);
  assert.match(validatorPrompt, /public behavior/);
  assert.match(validatorPrompt, /tautological/);
});

test("allows Probity to judge deletion of all file content", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-probity-"));
  const filePath = join(root, "value.ts");
  await writeFile(filePath, "export const obsolete = true;\n", { encoding: "utf8", flag: "wx" });
  const agent: Agent = {
    reason: async (): Promise<Verdict> => ({ kind: "pass", reason: "" }),
  };
  const context = {
    signal: undefined,
    sessionManager: { getBranch: () => [] },
  } as unknown as ExtensionContext;
  const evaluate = createProbityWriteEvaluator(() => agent);

  const result = await evaluate({ kind: "write", path: filePath, content: "" }, context);

  assert.deepEqual(result, { kind: "pass", reason: "" });
});
