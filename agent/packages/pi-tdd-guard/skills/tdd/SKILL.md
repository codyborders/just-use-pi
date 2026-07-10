---
name: tdd
description: Test-driven development for behavior-bearing code. Use whenever TDD Guard is active, when building features or fixing bugs, or when the user requests test-first work, red-green development, or integration tests.
---

# Test-Driven Development

Work in vertical Red → Green slices. This skill defines test quality and workflow; the Pi extension and Probity enforce source writes at tool boundaries.

Read `CONTEXT.md` when present, relevant ADRs, project instructions, and nearby tests before choosing a seam or naming behavior.

## Choose a public seam

A seam is the public boundary where behavior can be observed without reaching into implementation details.

When an existing public seam is obvious, state it briefly and proceed. Ask the user before writing a test only when the contract is unclear or materially different seams would produce different designs, costs, or coverage.

Tests should remain valid when internals are refactored without changing behavior.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for boundary guidance.

## Write tests worth keeping

A good test describes caller-visible behavior through a public interface. Its expected value comes from an independent source such as a worked example or known literal. It fails when behavior is absent or wrong, survives internal restructuring, and makes one logical behavioral claim.

Private-method tests, internal call assertions, and project-owned collaborator mocks couple the suite to implementation. Expected results that repeat the implementation calculation or compare a value to itself are tautological. Write one test, learn from its result, and then choose the next case.

## Run one vertical slice

**Red:** Add one behavior-driving test and run the narrow relevant command. Confirm the failure comes from the expected assertion or behavior mismatch. Failures during test loading or setup do not establish a clean red. When infrastructure prevents the assertion from running, add only the placeholder needed to reach it.

**Green:** Add the minimum production behavior required by the observed failure. Run the narrow test again, followed by the broader relevant suite. Start the next behavior with a new red test.

Do not write all tests first and implementation later. Each cycle is a tracer bullet informed by the previous result.

## Refactoring

Refactoring is optional review work, not a mandatory step between every Red → Green slice. Refactor only while relevant tests are green. Do not introduce new behavior during refactoring.

## Guard interaction

Use Pi's `edit` and `write` tools for source changes so Probity can inspect pending content. Do not mutate source through shell redirection, in-place editors, patch commands, inline scripts, or other bypasses.

A guard block is evidence that the pending write lacks a valid TDD justification. Address the named problem. Do not weaken the test, alter expected behavior to match broken code, disable the guard, or search for another write path.

Only the user may disable enforcement with `/tdd off` or authorize a specific exception in the conversation.
