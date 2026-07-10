# Pi Frontend Standards

This Pi package adapts the Frontend Agent Standards Pack for everyday agent use. It puts product evidence inside an established design system, constrains visual choices through semantic tokens, and requires rendered checks before completion.

## Resources

- `frontend-design` guides implementation from repository inspection through screenshot review.
- `frontend-design-review` audits a rendered interface without requiring a Figma file.
- `/frontend-task <change>` starts an implementation task with the design skill loaded.
- `/frontend-review` returns a structured visual review for a supplied route or screenshot set.
- `standards/` contains shared rules, archetypes, the task brief, and the review rubric.

The package intentionally has no extension. Frontend rules depend on each repository's design system, page purpose, and rendered result. A generic tool-call interceptor would mistake legitimate system values for violations; it also could not assess hierarchy or product specificity. Repository linters provide mechanical enforcement, while the skills discover and run them.

## Design authority

Explicit task requirements take precedence. Established project components and tokens come next. Package defaults fill gaps without creating a competing design language.

## Verification

The implementation skill discovers real validation scripts instead of assuming fixed command names. When browser tooling is available, it reviews representative phone, tablet-width, and wide-screen renders.
