# Frontend Task Brief

Complete this working brief before implementation. Keep each answer concrete and short.

| Field | Required answer |
|---|---|
| Change | User-visible result |
| Context mode | Existing system, partial system, greenfield, or ambiguous |
| Page archetype | One selection from `page-archetypes.md` |
| User and purpose | Who uses the interface and why |
| Primary task | Result the user must be able to produce |
| Primary action | Single most important action |
| Secondary action | At most one adjacent action, when needed |
| Required content | Information needed to understand the page, make a choice, or act |
| Product evidence | Product interface, real data, code sample, terminal output, technical diagram, workflow diagram, or product-specific illustration |
| Existing system | Layouts, components, named variants, and semantic tokens to reuse |
| Missing capability | Required design-system behavior that does not exist yet |
| Responsive behavior | Reading order and action priority at each target width |
| Accessibility | Applicable keyboard, screen-reader, contrast, focus, touch-target, or reduced-motion requirement |
| Acceptance checks | Repository scripts for linting, compilation, behavior, accessibility, and visual tests |

Account for applicable states in one line:

```text
default | hover | focus | active | selected | disabled | loading | empty | success | error
```

Resolve each missing design-system capability before introducing feature-specific styling. End by reviewing the final render against `visual-review-rubric.md`.
