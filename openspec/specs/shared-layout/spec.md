## ADDED Requirements

### Requirement: Default layout SHALL wrap pages with SiteHeader and SiteFooter

The system SHALL provide a `default` layout that renders `<SiteHeader>` at the top, `<slot />` in the middle, and `<SiteFooter>` at the bottom of every page using it.

#### Scenario: Page uses default layout

- **WHEN** a page does not specify a `layout` and is rendered
- **THEN** the rendered DOM contains `<SiteHeader>` before page content and `<SiteFooter>` after

### Requirement: SiteHeader SHALL display navigation and theme toggle

`<SiteHeader>` SHALL render at 56px height containing: a `◇` mark + date label on the left, a 7-item navigation row in the center (`index`, `projects`, `journal`, `about`, `skills`, `journey`, `contact`), and an `EN` pill + theme toggle pill on the right.

#### Scenario: Active nav item is highlighted

- **WHEN** the current route is `/about`
- **THEN** the `about` nav item has visible underline / opacity 1 while others have opacity 0.6

#### Scenario: Theme toggle flips dark mode

- **WHEN** the user clicks the theme toggle pill
- **THEN** `<html>` toggles class `dark` and CSS Variables flip values

### Requirement: SiteFooter SHALL display copyright and slogan

`<SiteFooter>` SHALL render at 36px height containing: copyright (`© 2026 — grayson · index 00`) on the left, slogan (`— a portfolio in beige`) in the middle, scroll prompt (`scroll ↓`) on the right.

#### Scenario: Footer renders all three sections

- **WHEN** any page is rendered
- **THEN** the footer DOM contains three child elements with the corresponding text

### Requirement: TickWall SHALL render a vertical stack of short horizontal lines

`<TickWall>` SHALL accept `count` (number of lines), `length` (max line width in px), and `gap` (spacing in px) props, rendering `count` horizontal lines stacked vertically with `length` as the line width.

#### Scenario: Component renders requested count

- **WHEN** rendered with `:count="5" :length="56" :gap="16"`
- **THEN** the DOM contains 5 child divs with `width: 56px` (or `42px` for every 3rd line) and `gap: 16px` between them

### Requirement: TagChip SHALL render a pill-style tag

`<TagChip>` SHALL render a slotted text element with `border: 1px solid var(--ink)`, `border-radius: 100px`, `padding: 3px 10px`, and `font-mono text-[10px]`. An `active` prop SHALL invert background (`bg-ink text-bg`).

#### Scenario: Default chip

- **WHEN** rendered with default props and slot text "css"
- **THEN** the element has the specified border and padding styles

#### Scenario: Active chip is inverted

- **WHEN** rendered with `:active="true"`
- **THEN** background is `var(--ink)` and text color is `var(--bg)`

### Requirement: GeoPortrait SHALL render a geometric portrait placeholder

`<GeoPortrait>` SHALL render a 400×460 (default) container composed of `var(--cool)` and `var(--bg)` rectangles in a φ-inspired tiling, used as an abstract portrait substitute.

#### Scenario: Portrait renders at default size

- **WHEN** rendered without explicit size props
- **THEN** the container is 400px wide and 460px tall, containing geometric tiles in cool and bg colors

### Requirement: Playground page SHALL display all shared components for visual reference

`/playground` SHALL be a route that renders SiteHeader, SiteFooter, PhiLines, TickWall, TagChip, GeoPortrait in sample configurations for visual QA against the design file.

#### Scenario: Playground is reachable in dev

- **WHEN** a developer navigates to `/playground` in dev mode
- **THEN** the page renders all shared components with sample data
