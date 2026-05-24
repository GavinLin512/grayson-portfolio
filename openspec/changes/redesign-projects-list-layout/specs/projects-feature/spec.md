## MODIFIED Requirements

### Requirement: Projects list route SHALL display all projects

The `/projects` route SHALL render projects authored as Markdown files under `content/projects/` inside a two-column split layout. The LEFT column (≈60%) SHALL list projects; each row SHALL show, in order: zero-padded index number, year, a serif title (`font-mincho`, ≈32px) with a single-line subtitle prefixed by `—` below it, and a single category label. The RIGHT column (≈40%) SHALL be a `preview` panel that mirrors the currently-hovered (or last-hovered) project. The page background SHALL use `var(--paper)`.

#### Scenario: Each project entry shows required fields

- **WHEN** the page is rendered with a project entry
- **THEN** the entry shows index (e.g. `02`), four-digit year (e.g. `2025`), serif title, `—` prefixed subtitle, and a single lowercase category label (`product` / `system` / `side` / `identity`)

#### Scenario: List rows are visually separated

- **WHEN** multiple entries are rendered
- **THEN** each row has a `1px solid var(--line)` bottom border

#### Scenario: Stack chips and arrow are NOT shown in the list row

- **WHEN** a project row is rendered
- **THEN** the row SHALL NOT show stack tags or a `→` arrow (these are moved to the preview panel or removed)

#### Scenario: Layout falls back to single column on small screens

- **WHEN** viewport width is below the `lg` Tailwind breakpoint
- **THEN** the preview panel SHALL be hidden and the list SHALL span the full width

## ADDED Requirements

### Requirement: Projects list page SHALL show a hover preview panel

The `/projects` route SHALL render a `preview` panel in the right column that updates to reflect the project the user is currently hovering. The panel SHALL contain: the label `preview · hover`, a placeholder preview area styled with a 45° repeating-line pattern, a centered `NN - Title` chip overlaying the placeholder, a short description below, and tech tag pills derived from the project's `stack` frontmatter field.

#### Scenario: Hovering a row updates the preview panel

- **WHEN** the user moves the cursor over a project row
- **THEN** the preview panel SHALL show that project's index, title, description, and stack tags

#### Scenario: Preview panel persists last hovered project on mouseleave

- **WHEN** the cursor leaves a project row
- **THEN** the preview panel SHALL continue to show the most recently hovered project (it SHALL NOT reset to empty)

#### Scenario: Preview panel shows a default project on first render

- **WHEN** the page is first rendered and no row has been hovered yet
- **THEN** the preview panel SHALL show the first project in the list

#### Scenario: Preview area uses a diagonal-line placeholder

- **WHEN** the preview panel is rendered
- **THEN** the preview area SHALL display a 45° repeating-line pattern (image placeholder)

### Requirement: Projects list page SHALL include category filter tabs

The header of `/projects` SHALL show four filter tabs on the right: `all`, `product`, `system`, `side`. Clicking a tab SHALL filter the visible list to projects whose `category` matches; `all` SHALL show every project. The active tab SHALL be visually distinguished.

#### Scenario: Filter tab narrows the list

- **WHEN** the user clicks the `product` tab
- **THEN** only projects with `category: product` SHALL appear in the list

#### Scenario: All tab resets the list

- **WHEN** the user clicks the `all` tab
- **THEN** every project SHALL appear in the list

#### Scenario: Filter state is client-only

- **WHEN** the user activates a filter
- **THEN** the URL SHALL NOT change (no query string, no route navigation)

### Requirement: Projects list header SHALL count selected projects

The header on the LEFT of `/projects` SHALL render `— 02 / projects · N selected` where `N` is the number of projects currently visible after filtering.

#### Scenario: Header count reflects active filter

- **WHEN** the `system` filter is active and 4 projects match
- **THEN** the header SHALL read `— 02 / projects · 4 selected`

### Requirement: Project frontmatter SHALL include a category field

Every Markdown file under `content/projects/` SHALL include a `category` frontmatter field whose value is one of: `product`, `system`, `side`, `identity`. The `content.config.ts` collection schema SHALL enforce this via a `z.enum` validator.

#### Scenario: Build fails when category is missing

- **WHEN** a project markdown file lacks `category` or uses a value outside the enum
- **THEN** `pnpm build` SHALL fail with a schema validation error

#### Scenario: Existing samples include category

- **WHEN** the repository is built
- **THEN** `01-field.md` and `02-hina.md` SHALL each declare a valid `category`

### Requirement: Project subtitle SHALL be a short em-dash description

The `subtitle` frontmatter field of every project SHALL be a short phrase (≤ 40 chars) starting with `— ` (em dash + space). The list SHALL render it directly below the title.

#### Scenario: Subtitle renders below title with em dash

- **WHEN** a project's `subtitle` is `— design system`
- **THEN** the list shows `— design system` below the title in a smaller font

### Requirement: Six project samples SHALL be present

`content/projects/` SHALL contain six markdown samples with single-word codename titles: `Field`, `Hina`, `Kata`, `Mori`, `Foglight`, `Hako`. Each SHALL have valid frontmatter (including the new `category`); body content for the four new samples MAY be a WIP placeholder.

#### Scenario: List shows six entries by default

- **WHEN** `/projects` loads with no filter applied
- **THEN** the list SHALL render six rows

#### Scenario: New samples may carry a WIP body placeholder

- **WHEN** a user opens `/projects/03-kata`
- **THEN** the page MAY display a WIP notice in the body while frontmatter renders correctly
