/**
 * Covers Pi session-to-Probity history conversion using public session message shapes and tool-call correlation.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { toRawHistory } from "../src/history-adapter.js";

test("converts prompts and completed tool calls in chronological order", () => {
  const entries = [
    {
      type: "message",
      message: { role: "user", content: "Add one behavior", timestamp: 1 },
    },
    {
      type: "message",
      message: {
        role: "assistant",
        content: [
          { type: "text", text: "I will run the test." },
          { type: "toolCall", id: "call-1", name: "bash", arguments: { command: "npm test" } },
        ],
        timestamp: 2,
      },
    },
    {
      type: "message",
      message: {
        role: "toolResult",
        toolCallId: "call-1",
        toolName: "bash",
        content: [{ type: "text", text: "1 failing" }],
        isError: true,
        timestamp: 3,
      },
    },
  ];

  assert.deepEqual(toRawHistory(entries), [
    { kind: "prompt", text: "Add one behavior" },
    {
      kind: "action",
      tool: "bash",
      input: { command: "npm test" },
      output: "1 failing",
      toolUseId: "call-1",
    },
  ]);
});

test("keeps tool results when their assistant call was compacted away", () => {
  const entries = [
    {
      type: "message",
      message: {
        role: "toolResult",
        toolCallId: "orphaned-call",
        toolName: "edit",
        content: [
          { type: "text", text: "Applied" },
          { type: "image", data: "ignored", mimeType: "image/png" },
        ],
        isError: false,
        timestamp: 3,
      },
    },
  ];

  assert.deepEqual(toRawHistory(entries), [
    {
      kind: "action",
      tool: "edit",
      input: {},
      output: "Applied",
      toolUseId: "orphaned-call",
    },
  ]);
});

test("ignores non-message entries and non-user prose", () => {
  const entries = [
    { type: "model_change", provider: "openai", modelId: "gpt" },
    {
      type: "message",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "Internal narration" }],
        timestamp: 2,
      },
    },
  ];

  assert.deepEqual(toRawHistory(entries), []);
});
