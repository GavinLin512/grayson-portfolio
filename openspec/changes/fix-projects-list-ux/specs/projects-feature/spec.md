## MODIFIED Requirements

### Requirement: Projects list route SHALL display all projects

The `/projects` route SHALL render a list of projects inside a `h-full flex flex-col` container that fills the `<main>` area without triggering an outer scrollbar. The list column SHALL be `overflow-y-auto` to scroll internally if content exceeds height. The page container SHALL NOT set its own background color, inheriting the layout's `--bg` token. Each row SHALL animate its background color via CSS `transition-[background-color] duration-200` when the selected project changes; the selected row's background SHALL be set via `:style="{ backgroundColor: 'var(--paper)' }"` so the transition triggers on Vue reactive updates. The `NuxtLink` row element SHALL NOT include a `block` class alongside `grid`.

#### Scenario: Page fills viewport without outer scrollbar

- **WHEN** `/projects` is rendered in a viewport tall enough to show all rows
- **THEN** the outer `<main>` element does NOT display a scrollbar and the page content does not overflow the viewport

#### Scenario: Page background is consistent with header and footer

- **WHEN** `/projects` is rendered
- **THEN** the page content area has the same background color as the site header and footer (`--bg`)

#### Scenario: Row hover animates smoothly

- **WHEN** the user moves the mouse from one row to another
- **THEN** the newly hovered row's background transitions from transparent to `var(--paper)` over 200ms, and the previously selected row transitions back to transparent over 200ms

#### Scenario: Selected row maintains background after mouseleave

- **WHEN** the user hovers a row and then moves the mouse away from the list entirely
- **THEN** the last hovered row retains its `var(--paper)` background

#### Scenario: Each project entry shows required fields

- **WHEN** the page is rendered with a project entry
- **THEN** the entry shows zero-padded index, year (4 digits), serif title (`font-mincho text-[32px]`), subtitle with `—` prefix (`font-mono text-[13px]`), and category label (right-aligned mono)

#### Scenario: List rows are visually separated

- **WHEN** multiple entries are rendered
- **THEN** each row has a `1px solid var(--line)` bottom border

#### Scenario: Project count label handles null data

- **WHEN** `useAsyncData` returns `null`
- **THEN** the label renders `· 0 selected` instead of throwing a TypeError
