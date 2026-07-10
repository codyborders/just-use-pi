/**
 * Covers pending Pi write/edit normalization by comparing resulting content and rejecting edits Pi cannot apply exactly.
 */

import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { toPendingWrite } from "../src/action-adapter.js";

test("normalizes a write to an absolute Probity action", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-action-"));

  const result = await toPendingWrite(
    { toolName: "write", input: { path: "src/value.ts", content: "export const value = 1;\n" } },
    root,
  );

  assert.deepEqual(result, {
    ok: true,
    action: {
      kind: "write",
      path: join(root, "src/value.ts"),
      content: "export const value = 1;\n",
    },
  });
});

test("applies multiple edits against the same original content", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-action-"));
  const filePath = join(root, "src", "value.ts");
  await mkdir(join(root, "src"));
  await writeFile(filePath, "const first = 1;\nconst second = 2;\n", { encoding: "utf8", flag: "wx" });

  const result = await toPendingWrite(
    {
      toolName: "edit",
      input: {
        path: filePath,
        edits: [
          { oldText: "first = 1", newText: "first = 10" },
          { oldText: "second = 2", newText: "second = 20" },
        ],
      },
    },
    root,
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.action.content, "const first = 10;\nconst second = 20;\n");
  }
});

test("rejects a non-unique edit instead of validating different content than Pi", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-action-"));
  const filePath = join(root, "value.ts");
  await writeFile(filePath, "same\nsame\n", { encoding: "utf8", flag: "wx" });

  const result = await toPendingWrite(
    {
      toolName: "edit",
      input: {
        path: filePath,
        edits: [{ oldText: "same", newText: "changed" }],
      },
    },
    root,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /matches 2 locations/);
  }
});

test("rejects overlapping edits", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-tdd-action-"));
  const filePath = join(root, "value.ts");
  await writeFile(filePath, "alpha beta gamma\n", { encoding: "utf8", flag: "wx" });

  const result = await toPendingWrite(
    {
      toolName: "edit",
      input: {
        path: filePath,
        edits: [
          { oldText: "alpha beta", newText: "first" },
          { oldText: "beta gamma", newText: "second" },
        ],
      },
    },
    root,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /overlap/);
  }
});
