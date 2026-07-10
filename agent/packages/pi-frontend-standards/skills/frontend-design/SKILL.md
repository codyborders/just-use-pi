---
name: frontend-design
description: Build or revise product-specific web interfaces with design-system discipline and rendered verification. Use for HTML, CSS, JavaScript, or TypeScript frontend work including marketing pages, dashboards, forms, settings, authentication, components, empty states, and responsive UI.
---

# Frontend Design

Treat frontend design as a closed system: understand the product and its visual language before adding UI. Distinctiveness should come from product evidence, information hierarchy, and precise composition instead of generic decoration.

## Authority

Explicit user requirements and approved design specifications govern first. Existing project components and conventions govern next. Use this package's defaults only to fill gaps. Ask one focused question when those authorities conflict; never create a second visual language silently.

## 1. Detect the design context

Inspect relevant source before planning markup. Find theme and token files, typography and icon conventions, layout primitives, component libraries, nearby pages, and frontend validation scripts.

| Mode | Evidence | Response |
|---|---|---|
| Existing system | Several token and component categories are established | Reuse them |
| Partial system | Some visual conventions exist | Preserve them and fill only uncovered needs |
| Greenfield | No meaningful visual system exists | Define the smallest semantic token set and reusable primitives needed for this task |
| Ambiguous | Signals conflict | Ask which direction governs the work |

Continue only after recording the mode and the files that support it.

## 2. Select an archetype

Read [`../../standards/page-archetypes.md`](../../standards/page-archetypes.md) completely. Choose the closest archetype before implementation. A feature inside an established application normally uses the component or application-feature archetype unless it replaces an entire page.

The selection is complete when every required region or state is accounted for and genuinely inapplicable items are marked as such.

## 3. Define hierarchy and evidence

Use [`../../standards/task-brief.md`](../../standards/task-brief.md) to state the working contract:

```text
page purpose and user
primary task and primary action
optional secondary action
required content and section order
concrete product evidence
components and tokens to reuse
responsive behavior
accessibility requirements
```

Prefer a real product interface, then real data, code or terminal output, a technical or process diagram, and finally a product-specific illustration. When interface copy changes, read [`../../standards/content-standards.md`](../../standards/content-standards.md) completely before drafting it.

Move on when every section supports the primary task and the archetype's first viewport contains the required product evidence.

## 4. Establish implementation constraints

Read these files completely before changing frontend source:

- [`../../standards/frontend-standards.md`](../../standards/frontend-standards.md)
- [`../../standards/forbidden-patterns.md`](../../standards/forbidden-patterns.md)

An existing system owns component behavior and visual values. Use approved components with named variants. Treat shared design-system source and standards as protected during product UI work. If a required capability is missing, report the exact gap and ask before changing the design system or adding a one-off variant. In partial and greenfield systems, place new values in reusable semantic tokens rather than scattering raw values through feature code.

Implementation may begin once every component and visual value has an established source or one clearly defined new semantic source.

## 5. Build the smallest complete slice

Implement in reading order. Preserve semantic HTML and keyboard behavior. Keep focus visible and honor reduced-motion preferences. Cover each state the feature can enter, including disabled or selected behavior and any loading, empty, success, or error result. Keep action priority and content order intact as the viewport changes.

Motion should explain feedback or continuity. A card should mark a useful boundary or grouped interaction.

Finish this step only when the requested flow works through every applicable state and representative width.

## 6. Run repository checks

Run the actual frontend checks found in step 1. Exercise available linting and compilation, behavior tests, accessibility checks, and visual tests. Do not invent script names. Do not update visual baselines unless the task explicitly authorizes a reviewed baseline change.

Every available check must pass. For an unavailable category, record the evidence showing that the repository does not provide it.

## 7. Verify rendered output

Capture the affected interface with project browser tooling when possible. Otherwise use another available browser automation tool. Review these representative viewports:

```text
390 x 844
768 x 1024
1440 x 900
```

Inspect primary interactions and visible focus where practical. Read [`../../standards/visual-review-rubric.md`](../../standards/visual-review-rubric.md) completely, score the render, fix each critical failure and applicable violation, then capture the corrected result once.

When browser access is unavailable, apply the same rubric to source and state that rendered verification could not run. Completion requires a passing review or a concrete external blocker for every remaining failure.

## Completion report

State the archetype and context mode. Name reused or added system resources, the product evidence shown, every command and result, screenshot paths or the browser limitation, and any unresolved design-system capability or external blocker.
