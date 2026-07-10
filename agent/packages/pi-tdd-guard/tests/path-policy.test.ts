/**
 * Covers TDD enforcement scope by checking behavior-bearing files are guarded and generated or prose files are excluded.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { isBehaviorCodePath } from "../src/path-policy.js";

for (const path of [
  "/repo/src/value.ts",
  "/repo/tests/value.test.ts",
  "/repo/app/model.py",
  "/repo/lib/value.rb",
  "/repo/main.go",
  "/repo/src/view.tsx",
  "/repo/scripts/release.sh",
]) {
  test(`guards behavior code: ${path}`, () => {
    assert.equal(isBehaviorCodePath(path), true);
  });
}

for (const path of [
  "/repo/README.md",
  "/repo/package.json",
  "/repo/node_modules/package/index.ts",
  "/repo/dist/generated.js",
  "/repo/coverage/report.js",
  "/repo/vendor/library.rb",
  "/repo/src/value.ts.map",
]) {
  test(`does not guard excluded content: ${path}`, () => {
    assert.equal(isBehaviorCodePath(path), false);
  });
}
