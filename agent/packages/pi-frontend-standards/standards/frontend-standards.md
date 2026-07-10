# Frontend Standards

## Operating principle

A strong interface reveals its product and follows one visual system. It stays restrained, reads clearly, and helps users act. Real screens or data should explain the product whenever possible. Code and workflows offer further evidence; product terminology anchors that evidence in context. Build hierarchy with scale and spacing, then reinforce it through weight or alignment.

## Design-system modes

| Mode | Required behavior |
|---|---|
| Existing system | Use established components, named variants, semantic tokens, the approved icon family, and current motion conventions. |
| Partial system | Preserve every established convention. Add only the semantic token or reusable primitive the task lacks, using the project's styling layer. |
| Greenfield | Define a small semantic foundation before composing a page. |

A greenfield foundation needs neutral surfaces and text, one brand accent, semantic status colors, named type and spacing roles, a small radius set, one elevation approach or none, one icon family, plus explicit focus and motion behavior. Page-local values need a reusable name and owner before use.

## Typography

Use one UI font family. Reserve monospace for source code and commands. It also fits terminal output or fixed-width data. Paths and identifiers may warrant it when their exact form matters.

Use named roles:

```text
caption
small
body
lead
subheading
section-heading
page-heading
```

A practical greenfield scale is:

```text
caption          12 / 16
small            14 / 20
body             16 / 24
lead             18 / 28
subheading       24 / 32
section-heading  32 / 40
page-heading     40-56 / 1.05-1.15
```

Write sentence-case text and let headings wrap naturally. Keep prose near 60 to 72 characters per line. Use regular body weight and 600 or 700 for headings or strong emphasis; limit the interface to three weights. Centered paragraphs should remain short enough to fit within two lines.

## Layout

Left alignment is the default. Centering fits authentication panels and compact empty, confirmation, or approved call-to-action regions.

Use named container roles such as `prose`, `content`, `page`, and `wide`. A practical greenfield spacing scale is:

```text
4  8  12  16  24  32  48  64  96
```

A section needs a clear purpose and one coherent content group. Give it a visible heading when context requires one. Consistent vertical spacing should expose the reading order. Empty space earns its place by improving readability or grouping.

## Visual tokens

Use neutral surface and text scales with one brand accent. Status colors should map to success, warning, danger, or information. Application code consumes semantic tokens instead of raw literals.

Choose one approved elevation system or omit shadows. Functional boundaries must remain legible without decorative effects. Use project radius tokens; a practical greenfield set is `4px`, `8px`, and `12px`. Full pills belong to tags, status chips, avatars, toggles, or compact segmented controls. Primary controls use the normal component radius.

## Icons and motion

Use one approved icon family with fixed sizes and consistent stroke weights. An icon communicates meaning but does not replace a clear label. Designed icons replace emoji in interface controls.

Motion can explain state change, navigation, expansion, collapse, reordering, loading progress, or direct manipulation. Respect reduced-motion preferences. Motion must not delay content access.

## Controls and state

A visual region gets one primary action with at most one adjacent secondary action. Labels name both operation and object, as in `Install CLI`, `Create project`, `Invite teammate`, or `View documentation`.

A card should create a useful boundary, group related information, or act as an interactive unit. Plain layout often needs less chrome. Dividers or tables can supply the boundary; spacing can handle grouping.

Account for each state the feature can enter:

```text
default | hover | focus | active | selected | disabled | loading | empty | success | error
```

A state change must remain understandable without color alone.

## Accessibility

Use semantic elements with associated labels and logical reading order. Preserve keyboard operation and visible focus. Touch targets must remain usable, screen-reader names clear, and contrast compliant with WCAG AA. Reduced motion or script failure must not hide content or recovery actions.

## Responsive behavior

Review these viewports when tooling permits:

```text
390 x 844
768 x 1024
1440 x 900
```

Preserve reading order and action priority. Keep heading hierarchy and table usability intact. Form labels, touch targets, and required content must also survive each reflow. Adapt the composition deliberately instead of shrinking its desktop form until it fits.
