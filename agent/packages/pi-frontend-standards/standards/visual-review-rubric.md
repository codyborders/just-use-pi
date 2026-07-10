# Visual Review Rubric

Review every supplied wide-screen and narrow-screen render. Apply each relevant category and reject the interface for any critical failure.

## Product specificity

A passing interface visibly reflects the real product. It puts concrete evidence where the selected archetype requires it, while copy identifies a user, task, mechanism, result, or constraint.

| Rule | Failure evidence | Correction |
|---|---|---|
| `product-specificity.generic-interface` | Composition could represent an unrelated product | Replace generic regions with product-specific structure |
| `product-specificity.abstract-evidence` | Abstract decoration replaces product evidence | Show the interface, data, code, workflow, or technical diagram |
| `product-specificity.generic-copy` | Claims omit a product-specific task or mechanism | Name the user action and how the product supports it |

`product-specificity.logo-swap-test` is critical: a different logo and product noun make the interface suitable for an unrelated software company.

## Typography

A passing interface uses one UI family, reserves monospace for technical content, follows semantic roles, wraps headings naturally, and keeps body copy readable.

| Rule | Failure evidence | Correction |
|---|---|---|
| `typography.multiple-ui-fonts` | Several font personalities compete | Use the established UI family |
| `typography.decorative-heading` | Heading uses italics, gradient text, wide tracking, or manual breaks | Restore its semantic heading role |
| `typography.arbitrary-scale` | Type sizes do not form a coherent hierarchy | Map text to named roles |
| `typography.centered-long-copy` | Long prose is centered or too wide | Use a readable left-aligned measure |

## Composition

A passing composition follows its archetype. The primary task is obvious, reading order survives each viewport, and alignment or empty space clarifies groups.

| Rule | Failure evidence | Correction |
|---|---|---|
| `composition.archetype-gap` | Required region or state is absent | Add the missing functional region |
| `composition.competing-actions` | Several actions compete as primary | Establish one primary action |
| `composition.decorative-cards` | Cards fill space without useful grouping | Use plain layout, list, table, or dividers |
| `composition.mobile-order` | Narrow layout loses context or action priority | Reorder content around the primary task |
| `composition.spectacle-over-task` | Visual effect displaces product use | Center the composition on task evidence |

## Visual restraint and consistency

A passing interface gets hierarchy from scale and spacing, supported by weight, alignment, or grouping. Effects are functional and components share one token system.

| Rule | Failure evidence | Correction |
|---|---|---|
| `restraint.decorative-effects` | Gradients, glows, blobs, glass, or noise carry hierarchy | Restore semantic surfaces and typography |
| `restraint.decorative-imagery` | Generic imagery dominates product content | Replace it with concrete evidence |
| `restraint.pill-primary-control` | Primary control uses an oversized pill | Use the standard control radius |
| `restraint.multiple-systems` | Radius, shadow, border, icon, or color treatments conflict | Use the established token family |

## Content quality

Passing text uses concrete headings, controls with specific verbs and objects, explanations of mechanism or result, and qualified claims.

| Rule | Failure evidence | Correction |
|---|---|---|
| `content.generic-ai-language` | Copy relies on broad AI or transformation claims | Name the actual capability and result |
| `content.clever-over-clear` | Heading favors mood or wordplay over meaning | State the section purpose |
| `content.vague-action` | Control label is unspecific | Name the operation and object |
| `content.unqualified-claim` | Visible claim is absolute or unsupported | Bound or substantiate the claim |

## Accessibility

A passing render has readable contrast, visible keyboard focus, usable touch targets, logical order, clear control names, and motion that preserves access.

| Rule | Failure evidence | Correction |
|---|---|---|
| `accessibility.contrast` | Text or control lacks readable contrast | Use an approved accessible token pair |
| `accessibility.focus` | Supplied evidence shows no visible focus | Apply the system focus treatment |
| `accessibility.touch-target` | Control is too small or crowded for reliable touch | Increase its interactive area |
| `accessibility.label` | Control lacks a visible or inferable name | Add an associated label or accessible name |
| `accessibility.motion` | Motion hides content or ignores reduced-motion behavior | Preserve content and disable nonessential motion |

A task-critical control that cannot be perceived or operated is a critical failure.

## Responsive integrity

A passing interface keeps required content visible, adapts dense components deliberately, and does more than scale down the wide layout.

| Rule | Failure evidence | Correction |
|---|---|---|
| `responsive.clipping` | Required content clips, overlaps, or overflows | Reflow or constrain the affected region |
| `responsive.desktop-shrink` | Wide composition only shrinks | Define a narrow-layout reading order |
| `responsive.hidden-action` | Task-critical action disappears or loses context | Restore it near the relevant content |

A viewport that prevents the primary task is a critical failure.

## Result contract

Return this object:

```json
{
  "result": "pass",
  "critical_failures": [],
  "violations": [],
  "notes": []
}
```

Every finding names a rule, cites visible evidence, and identifies the affected viewport or state. Each non-critical violation includes a concrete correction. Set `result` to `fail` whenever either findings array contains an item.
