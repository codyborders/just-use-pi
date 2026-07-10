# Forbidden Frontend Patterns

Each pattern below requires explicit authorization in the task, an approved design specification, or an established design-system implementation. Without authorization, use the replacement shown.

## Typography

| Pattern | Required replacement |
|---|---|
| Decorative display or multiple font personalities | Established UI family with semantic weight |
| Monospaced marketing labels | UI type role; reserve monospace for technical content |
| Italic, gradient, oversized, or manually broken headings | Semantic heading role with natural wrapping |
| Uppercase, widely tracked eyebrow labels | Sentence-case context label |
| Arbitrary font sizes | Named type roles |

## Layout

| Pattern | Required replacement |
|---|---|
| Viewport-height marketing hero | Value proposition and product evidence in content-driven height |
| Centered long-form or content-heavy layout | Readable left-aligned measure |
| Empty space used as spectacle | Spacing that clarifies grouping and reading order |
| Generic feature-card row | Structure driven by the actual content |
| Repeated cards without a useful boundary | Plain layout, list, table, or divider |
| Arbitrary container width | Named container role |
| Decorative asymmetry that harms scanning | Clear alignment system |

## Effects and imagery

| Pattern | Required replacement |
|---|---|
| Decorative gradient, glow, blurred blob, glass panel, backdrop blur, grain, noise, text shadow, or neon border | Surface and type hierarchy supported by borders and spacing |
| Several shadow systems | One approved elevation scale or none |
| Orbit, star field, floating-object collage, node network, particle field, generic AI brain, robot, or cloud art | Real interface, real data, code, workflow, or product-specific diagram |
| Abstract artwork in place of evidence | Product mechanism in the archetype's required region |

## Components and styling

| Pattern | Required replacement |
|---|---|
| Pill-shaped primary button | Standard control radius |
| Emoji used as an interface icon | Approved icon with accessible label |
| One-off variant or unapproved icon library | Normal design-system review path |
| Raw control when an approved component exists | Component that already owns behavior and states |
| Custom navigation without approval | Established information architecture |
| New font import in feature code | Established font setup |
| Inline style or raw visual value | Semantic token and named variant |
| Raw CSS outside approved styling locations | Project styling layer that can govern and reuse it |

## Motion

Decorative entrances and perpetual animation need authorization. Otherwise motion exists only for feedback, continuity, progress, or direct manipulation.

## Copy

Generic transformation claims need concrete replacements:

| Generic frame | Replace with |
|---|---|
| `The future of...`, `Reimagine...`, or `Transform the way...` | Specific user and task |
| `Work smarter...` or `Unlock the power of...` | Mechanism and result |
| `Your work should compound` or `The memory that compounds` | Concrete mechanism and current result |
| `Built for the modern...` or `One platform for everything` | Current scope or constraint |

## Rejection test

Reject the design when changing the logo and product noun would make its composition and copy suitable for an unrelated software company.
