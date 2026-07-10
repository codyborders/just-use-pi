/**
 * Covers branch-safe guard state restoration by selecting the latest valid custom entry and defaulting enforcement on.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { loadGuardState } from "../src/guard-state.js";

test("defaults TDD enforcement on for sessions without state", () => {
  assert.deepEqual(loadGuardState([]), { active: true });
});

test("restores the latest valid TDD state on the active branch", () => {
  const entries = [
    { type: "custom", customType: "pi-tdd-guard-state", data: { active: false } },
    { type: "custom", customType: "other-extension", data: { active: true } },
    { type: "custom", customType: "pi-tdd-guard-state", data: { active: true } },
  ];

  assert.deepEqual(loadGuardState(entries), { active: true });
});

test("ignores malformed state entries", () => {
  const entries = [
    { type: "custom", customType: "pi-tdd-guard-state", data: { active: false } },
    { type: "custom", customType: "pi-tdd-guard-state", data: { active: "no" } },
  ];

  assert.deepEqual(loadGuardState(entries), { active: false });
});
