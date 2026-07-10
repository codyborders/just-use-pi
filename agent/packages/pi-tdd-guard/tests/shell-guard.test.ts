/**
 * Covers shell-bypass detection by checking direct source mutations are blocked while test and non-source commands remain usable.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { shellMutationReason } from "../src/shell-guard.js";

const blockedCommands = [
  "cat generated.ts > src/generated.ts",
  "printf 'x' >> app/model.py",
  "printf 'x' > scripts/release.sh",
  "sed -i '' 's/old/new/' lib/value.rb",
  "perl -pi -e 's/a/b/' src/value.ts",
  "tee src/value.go < /tmp/value",
  "cp /tmp/value src/value.rs",
  "mv /tmp/value src/value.js",
  "rm src/value.ts",
  "git checkout -- src/value.ts",
  "git restore src/value.ts",
  "git reset --hard",
  "git checkout main",
  "git switch main",
  "git clean -fd",
  "git apply changes.patch",
  "apply_patch < changes.patch",
  "python -c \"from pathlib import Path; Path('src/value.py').write_text('x')\"",
  "node -e \"require('fs').writeFileSync('src/value.ts', 'x')\"",
];

for (const command of blockedCommands) {
  test(`blocks source mutation: ${command}`, () => {
    const reason = shellMutationReason(command);

    assert.equal(typeof reason, "string");
    assert.match(reason ?? "", /edit or write tool/);
  });
}

const allowedCommands = [
  "npm test",
  "pytest -q > /tmp/pytest-results.txt",
  "rg 'value > 3' src/value.ts",
  "cp coverage.json /tmp/coverage.json",
  "rm -rf .pytest_cache",
  "git diff -- src/value.ts",
  "python scripts/check_types.py",
  "npx prettier --check src/value.ts",
];

for (const command of allowedCommands) {
  test(`allows non-mutating command: ${command}`, () => {
    assert.equal(shellMutationReason(command), undefined);
  });
}
