---
name: frontend-design-review
description: Audit rendered web interfaces for product specificity, design-system consistency, restrained composition, content quality, responsive hierarchy, and accessibility. Use when reviewing screenshots or a live page without requiring a Figma comparison.
---

# Frontend Design Review

Review what users can see. Report findings without praise, and do not substitute source-code preferences for rendered evidence.

## 1. Establish the target

Identify the page purpose, intended user, primary task, and closest archetype. Read [`../../standards/page-archetypes.md`](../../standards/page-archetypes.md) completely. Use repository context when available. Otherwise infer only what the screenshots support and record uncertainty in `notes`.

Proceed once one archetype and one primary task govern the review.

## 2. Gather rendered evidence

Use supplied screenshots or capture the live interface with existing project browser tooling. When available, inspect renders at these sizes:

```text
390 x 844
768 x 1024
1440 x 900
```

Capture task-relevant interaction states. These may include focus, selection, loading, empty results, or errors. Evaluate only what can be observed; missing required evidence is itself a violation when an applicable state cannot be verified.

Evidence is complete when it covers every supplied viewport and observable task-critical state.

## 3. Apply the standards

Read these files completely:

- [`../../standards/frontend-standards.md`](../../standards/frontend-standards.md)
- [`../../standards/content-standards.md`](../../standards/content-standards.md)
- [`../../standards/forbidden-patterns.md`](../../standards/forbidden-patterns.md)
- [`../../standards/visual-review-rubric.md`](../../standards/visual-review-rubric.md)

Apply the logo-swap test. If a different logo and product noun would make the page fit an unrelated software company, record a critical failure. Every finding needs specific visible evidence and the smallest correction that restores hierarchy or consistency.

All rubric categories must be evaluated at each applicable viewport without unsupported findings.

## 4. Return structured results

Return valid JSON with no surrounding Markdown:

```json
{
  "result": "pass",
  "critical_failures": [],
  "violations": [],
  "notes": []
}
```

Each finding uses this shape:

```json
{
  "rule": "category.rule-id",
  "evidence": "Specific visible evidence and viewport",
  "recommended_change": "Smallest concrete correction"
}
```

A critical failure may omit `recommended_change` when no safe local correction exists. Set `result` to `fail` whenever either findings array contains an item. Before returning, parse the output as JSON and verify that each finding names its rule plus the affected viewport or state.
