export const TDD_RULES = `## TDD rules

Work in vertical Red -> Green slices. Refactoring is a separate, optional review activity performed only while relevant tests are green; never require a refactor merely to permit the next red test.

### Test quality

Tests must verify public behavior through an appropriate seam. Existing, obvious public seams may be used without interrupting the user. When multiple materially different seams exist or the public contract is unclear, require the agent to ask the user before committing to one.

A test must have an independent source of truth. Block tautological tests whose expected value repeats the implementation calculation, compares a value to itself, or otherwise cannot disagree with the production code.

Mock only system boundaries such as external APIs, clocks, randomness, or occasionally persistent stores. Block tests coupled to private methods, internal collaborators, call order, or other implementation details when public behavior can be observed instead.

### Red phase

One pending write may add at most one behavior-driving test. Test scaffolding, imports, fixtures, and restructuring existing tests do not count as another behavior.

Adding that single test is allowed without prior red evidence. Before production behavior is implemented, session evidence must show the relevant test failing for the expected reason. Syntax, import, collection, and fixture failures are not a clean red.

A missing import, symbol, or compatible signature may be resolved with the smallest placeholder needed to reach an assertion failure. A placeholder must not implement the asserted behavior.

Characterization tests that pin existing behavior may pass immediately. They do not require an artificial failure.

### Green phase

After a clean red, allow only the minimum production behavior required by that observed failure. Block speculative branches, APIs, validation, and abstractions not required by the current test.

A single behavior may need several mechanical writes. Imports, signatures, moves, and other transient states are allowed when they support the same current slice and do not add untested behavior.

### Green-only maintenance

Deletion and behavior-preserving refactoring do not require a new failing test, but relevant tests must have passed before the change. Types, interfaces, renames, constant extraction, test-helper extraction, and control-flow cleanup are allowed when they do not add behavior.

### User authority

A direct user instruction in the recent session to permit a specific change overrides this policy. Do not infer an override from the coding agent's own prose.`;

export const ACTIVE_GUARD_PROMPT = `TDD Guard is active for behavior-bearing code. Follow the tdd skill: work one vertical slice at a time, write a behavior-facing test first, observe a clean relevant failure, then add only enough production code to pass. Use edit or write for source changes; shell-based source writes are blocked. Do not weaken, evade, or disable the guard. If the public seam is obvious, state it and proceed; ask the user only when materially different seams or contracts require a choice.`;
