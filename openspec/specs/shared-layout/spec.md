## ADDED Requirements

### Requirement: Content layout SHALL provide standard page padding

The system SHALL provide a `content` layout (`app/layouts/content.vue`) that wraps pages with `<SiteHeader>`, a `<main>` with `px-6 lg:px-[60px] py-[60px]`, and `<SiteFooter>`. Content pages SHALL declare `definePageMeta({ layout: 'content' })` and SHALL NOT set their own padding.

Full-bleed pages (e.g., Hero) SHALL continue using the `default` layout.

#### Scenario: Content page inherits padding from layout

- **WHEN** a page declares `definePageMeta({ layout: 'content' })`
- **THEN** the `<main>` element provides `px-6 lg:px-[60px] py-[60px]` and the page's root div contains no padding classes

### Requirement: PageHeader component SHALL be used for page labels

The system SHALL provide a `<PageHeader>` component (`app/components/PageHeader.vue`) for rendering the top-of-page label and horizontal rule. Pages SHALL use this component instead of hand-coding the structure.

- **label** prop: `font-mono text-[15px] opacity-70`, format `— XX / name`
- Rule: `border-t border-line mt-[14px]`
- Wrapper: `shrink-0 mb-[48px]`
- Default slot: optional right-side content (e.g., filter buttons)

#### Scenario: All content pages share consistent header style

- **WHEN** any content page renders
- **THEN** the top label and rule match the `PageHeader` component spec

### Requirement: Default layout SHALL wrap pages with SiteHeader and SiteFooter

The system SHALL provide a `default` layout that renders `<SiteHeader>` at the top, `<slot />` in the middle, and `<SiteFooter>` at the bottom of every page using it. A single `<SearchModal>` SHALL be mounted at the application root (`app.vue`), not inside any layout, so it is available on every page regardless of whether the page uses the `default` or `content` layout; it is triggered by Cmd+K.

#### Scenario: Page uses default layout

- **WHEN** a page does not specify a `layout` and is rendered
- **THEN** the rendered DOM contains `<SiteHeader>` before page content and `<SiteFooter>` after

#### Scenario: SearchModal opens via Cmd+K from any page

- **WHEN** the user presses Cmd+K (or Ctrl+K) on any page (using either the `default` or `content` layout)
- **THEN** `<SearchModal>` becomes visible regardless of which page is active

### Requirement: SiteHeader SHALL display navigation and theme toggle

`<SiteHeader>` SHALL render at 56px height containing: a `◇` mark + date label on the left, a 7-item navigation row in the center (`index`, `projects`, `journal`, `about`, `skills`, `journey`, `contact`), and an `EN` pill + theme toggle pill + a search trigger on the right. The search trigger SHALL be a `rounded-md` button showing a magnifier icon on the left, a `search` text label in the middle, and OS-aware keyboard shortcut keys on the right — `⌘` + `K` (two separate `<kbd>` elements) on macOS, `Ctrl` + `K` on Windows/Linux. The button has no hover fill effect.

#### Visual Detail: Search trigger button

| Property | Value |
|----------|-------|
| Height | `h-[30px]` |
| Padding | `px-[10px]` |
| Border | `border border-ink` |
| Border radius | `rounded-md` |
| Gap between elements | `gap-[6px]` |
| Icon | `<Search :size="13" />` (Lucide) |
| Label | `font-mono text-[13px]` — `"search"` |
| kbd gap | `gap-[2px]` between the two `<kbd>` elements |
| kbd border | `border border-ink/60` |
| kbd background | `bg-paper` |
| kbd border radius | `rounded` |
| kbd padding | `px-[5px] py-[2px]` |
| kbd font | `font-mono text-[11px]` |
| Hover | none |

Platform detection is deferred to `onMounted` (default `true` for SSR consistency) using `navigator.userAgent`.

#### Scenario: Active nav item is highlighted

- **WHEN** the current route is `/about`
- **THEN** the `about` nav item has visible underline / opacity 1 while others have opacity 0.6

#### Scenario: Theme toggle flips dark mode

- **WHEN** the user clicks the theme toggle pill
- **THEN** `<html>` toggles class `dark` and CSS Variables flip values

#### Scenario: Search trigger opens SearchModal

- **WHEN** the user clicks the search trigger button
- **THEN** `<SearchModal>` opens (equivalent to pressing Cmd+K)

#### Scenario: Shortcut hint reflects the OS

- **WHEN** the header is rendered on a non-macOS client
- **THEN** the search trigger shows `Ctrl` + `K` as two separate `<kbd>` elements (macOS shows `⌘` + `K`)

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

`<TagChip>` SHALL render a slotted text element with `border: 1px solid var(--ink)`, `border-radius: 100px`, `padding: 3px 10px`, and `font-mono text-[14px]`. An `active` prop SHALL invert background (`bg-ink text-bg`).

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

### Requirement: SiteHeader navigation text SHALL be at minimum 14px

All text rendered inside `<SiteHeader>` SHALL have a computed `font-size` of 14px or larger. This includes nav links, the date label, and TagChip text. Previous implementation used `text-[10px]` which violated this constraint.

#### Scenario: Nav links at 14px

- **WHEN** any SiteHeader navigation link is rendered
- **THEN** its computed `font-size` is at least 14px

#### Scenario: Date label at 14px

- **WHEN** the date label inside SiteHeader is rendered
- **THEN** its computed `font-size` is at least 14px

### Requirement: SiteFooter text SHALL be at minimum 14px

All text rendered inside `<SiteFooter>` SHALL have a computed `font-size` of 14px or larger. Previous implementation used `text-[10px]` which violated this constraint.

#### Scenario: All three footer spans at 14px

- **WHEN** any page using the default layout is rendered
- **THEN** all three child text spans inside SiteFooter have computed `font-size` of at least 14px

### Requirement: Playground page SHALL display all shared components for visual reference

`/playground` SHALL be a route that renders SiteHeader, SiteFooter, PhiLines, TickWall, TagChip, GeoPortrait in sample configurations for visual QA against the design file.

#### Scenario: Playground is reachable in dev

- **WHEN** a developer navigates to `/playground` in dev mode
- **THEN** the page renders all shared components with sample data
