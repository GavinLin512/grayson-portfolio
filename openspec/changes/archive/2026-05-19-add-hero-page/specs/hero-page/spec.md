## ADDED Requirements

### Requirement: Home route SHALL render Hero A layout

The `/` route SHALL render a full-viewport hero page with:
- A horizontal φ line at `y = 38.2%` (stroke 1px)
- A short echo line at `y = 23.6%` (stroke 0.5px, opacity 0.55)
- A vertical whisper line at `x = 61.8%` (stroke 0.5px)
- A cool-colored dot at the intersection `(61.8%, 38.2%)`
- The big title "Grayson's Portfolio." anchored bottom-right in `font-mincho text-[144px] leading-[0.95]`
- A `TickWall` of 5 ticks anchored bottom-left

#### Scenario: Desktop hero shows all decorative elements

- **WHEN** the viewport is 1280px wide or wider
- **THEN** the page shows all PhiLines elements, the TickWall on the left, and the big title at `right: 60px; bottom: 90px; text-align: right`

#### Scenario: Big title uses Mincho

- **WHEN** inspecting the rendered title element
- **THEN** computed `font-family` includes `Shippori Mincho`, `font-size` is 144px, and `font-weight` is 800 (extrabold)

### Requirement: Hero SHALL be responsive across mobile, tablet, desktop

The hero SHALL adapt to three breakpoints:
- Mobile (< 768px): hide left-side decorations; big title shrinks to `text-[64px]`
- Tablet (768–1279px): big title shrinks to `text-[96px]`; show simplified decorations
- Desktop (≥ 1280px): full original layout

#### Scenario: Mobile hero hides decorations

- **WHEN** the viewport is 375px wide
- **THEN** the TickWall and left-side note are hidden; the big title is visible at 64px

#### Scenario: Tablet adapts title size

- **WHEN** the viewport is 768px wide
- **THEN** the big title font-size is 96px

### Requirement: Home route SHALL be statically prerendered

The `/` route SHALL be prerendered at build time via Nuxt routeRules.

#### Scenario: Build outputs static HTML

- **WHEN** `pnpm build` is executed
- **THEN** `.output/public/index.html` exists with the rendered hero markup
