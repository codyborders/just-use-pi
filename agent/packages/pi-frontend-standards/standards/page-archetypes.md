# Approved Page Archetypes

Select one archetype before implementation. Preserve its required regions unless the task makes one genuinely inapplicable.

## Marketing product page

Use for a homepage or major product overview.

```text
Navigation → left-aligned value proposition → one primary action → concrete product evidence → proof or technical credibility → workflow → major capabilities → installation or usage example → final action
```

The first viewport shows a product screenshot, code sample, real data, or technical diagram. Keep the headline concrete and let content determine hero height.

## Product-detail landing page

Use for one feature, integration, or use case.

```text
Product context → specific problem → specific mechanism → product evidence → workflow → constraints or compatibility → proof → action
```

## Documentation page

```text
Documentation navigation → page title → short summary → prerequisites → sequential instructions → code examples → expected result → troubleshooting → related documentation
```

Optimize for scanning with stable anchors, constrained prose width, and copyable technical examples.

## Dashboard list page

```text
Page title → primary action → filters or search → optional summary or status → table or structured list → pagination or loading → empty state → error state
```

Prefer tables for comparable records. Keep the main action visible. Cards need a meaningful interaction boundary.

## Record-detail page

```text
Record identity and status → primary actions → key facts → main content → activity or related records → applicable result states
```

## Settings or form page

```text
Page title → scope explanation → grouped fields → inline help → validation → save or submit → separated destructive actions
```

Keep labels visible. A one-column form is the default unless users must compare values. Destructive controls remain distinct without competing with routine save behavior.

## Authentication page

```text
Product identity → authentication form → recovery path → required legal or policy links
```

A compact centered composition is acceptable. Keep decoration minimal and preserve keyboard operation or screen-reader support.

## Empty state

```text
State description → reason or context → one next action → optional compact detail
```

Keep the message brief and the action specific. Large illustrations and several competing actions obscure the recovery path.

## Error state

```text
Plain-language problem → useful cause or context → recovery action → optional support or diagnostic reference
```

Preserve user input and safe retry behavior where possible.

## Component or application feature

Use for a focused change inside an established interface.

```text
Purpose and surrounding context → information hierarchy → primary interaction → control states → result states → keyboard and screen-reader behavior → responsive behavior within the parent
```

Control states cover applicable behavior from this set:

```text
default | hover | focus | active | disabled
```

Result states use the same rule:

```text
loading | empty | success | error
```

Match surrounding tokens and components; one feature cannot introduce a new visual system.
