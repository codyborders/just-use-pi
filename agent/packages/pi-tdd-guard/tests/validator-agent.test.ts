/**
 * Covers Probity validator response parsing by accepting its exact contract and rejecting malformed or persuasive prose.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { parseVerdict } from "../src/validator-agent.js";

test("parses a Probity pass verdict", () => {
  assert.deepEqual(parseVerdict('  {"kind":"pass","reason":""}\n'), {
    kind: "pass",
    reason: "",
  });
});

test("parses a Probity violation verdict", () => {
  assert.deepEqual(parseVerdict('{"kind":"violation","reason":"No failing test was observed."}'), {
    kind: "violation",
    reason: "No failing test was observed.",
  });
});

test("accepts fenced and prose-prefixed JSON emitted by validators", () => {
  assert.deepEqual(parseVerdict('```json\n{"kind":"pass","reason":""}\n```'), {
    kind: "pass",
    reason: "",
  });
  assert.deepEqual(parseVerdict('Evaluation complete.\n{"kind":"pass","reason":""}'), {
    kind: "pass",
    reason: "",
  });
});

for (const response of [
  "The change is fine.",
  '{"kind":"allow","reason":""}',
  '{"kind":"violation"}',
  '{"kind":"violation","reason":""}',
  '{"kind":"pass","reason":42}',
  '{"kind":"pass","reason":"","extra":true}',
  "",
]) {
  test(`rejects malformed validator output: ${JSON.stringify(response)}`, () => {
    assert.throws(() => parseVerdict(response), /valid Probity verdict/);
  });
}
