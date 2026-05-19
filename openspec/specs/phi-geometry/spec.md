## ADDED Requirements

### Requirement: PHI constants SHALL be available as a composable

The system SHALL provide a `usePhi` composable (or a static module) that exports `PHI_INV = 0.6180339887` and `PHI_INV2 = 0.3819660113`.

#### Scenario: Composable returns correct constants

- **WHEN** a Vue component imports `PHI_INV` and `PHI_INV2` from `~/composables/usePhi`
- **THEN** `PHI_INV` equals `0.6180339887` and `PHI_INV2` equals `0.3819660113`

### Requirement: PhiLines component SHALL render an array of decorative lines

The `<PhiLines>` Vue component SHALL accept a `lines` prop (array of `{ x1, y1, x2, y2, width?, opacity? }`) and an optional `dot` prop (object `{ cx, cy, r? }`), rendering them as SVG `<line>` and `<circle>` elements.

#### Scenario: Component renders one horizontal line

- **WHEN** rendered with `lines=[{ x1: 0, y1: '38.2%', x2: '100%', y2: '38.2%', width: 1 }]`
- **THEN** SVG output contains one `<line>` with the corresponding attributes

#### Scenario: Optional dot is rendered at the φ intersection

- **WHEN** rendered with a `dot={ cx: '61.8%', cy: '38.2%' }` prop
- **THEN** SVG output contains a `<circle>` filled with `var(--cool)` at that position

### Requirement: PhiLines SHALL use a fixed viewBox with non-uniform scaling

The internal `<svg>` element SHALL use `viewBox="0 0 100 100"` and `preserveAspectRatio="none"` so that coordinates expressed as percentages (`'38.2%'`, `'61.8%'`) map directly to the parent container regardless of its dimensions.

#### Scenario: Lines stretch to fill arbitrary container sizes

- **WHEN** the same `<PhiLines>` instance is rendered inside a 1280×720 container and inside a 375×667 container
- **THEN** the line endpoints in both cases land at the same percentage positions (e.g., y=38.2% of container height)

#### Scenario: Works in SSG without hydration mismatch

- **WHEN** the page containing `<PhiLines>` is statically prerendered and later hydrated on the client
- **THEN** no hydration mismatch warning is emitted; SVG content is identical between server and client renders
