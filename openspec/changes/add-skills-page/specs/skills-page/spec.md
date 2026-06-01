## ADDED Requirements

### Requirement: Skills route SHALL render a 4-column grid

The `/skills` route SHALL render a 4-column CSS grid (`grid-cols-4 gap-12`) on desktop, each column displaying one category from `content/skills.yml`: Backend, Frontend, DevOps, Database.

#### Scenario: Desktop renders 4 columns

- **WHEN** the viewport is ≥ 1024px wide
- **THEN** the grid shows 4 equal-width columns, one per category

### Requirement: Each category column SHALL show category label, chip cluster, and Caveat note

A category column SHALL contain: a category name as `<label>` (Space Mono 11px), a chip cluster of skill names (using `<TagChip>`), and one line of Caveat-font commentary at the bottom.

#### Scenario: Backend column shows expected content

- **WHEN** `content/skills.yml` has `backend: [Go, Python, Node.js, PostgreSQL, Redis]`
- **THEN** the Backend column shows a "Backend" label, 5 chips with those skill names, and a Caveat note

### Requirement: Skills route SHALL be responsive

The grid SHALL collapse to 2 columns at tablet (768–1023px) and 1 column at mobile (< 768px).

#### Scenario: Tablet shows 2 columns

- **WHEN** the viewport is 768px wide
- **THEN** the grid shows 2 columns (Backend + Frontend on row 1, DevOps + Database on row 2)

#### Scenario: Mobile shows 1 column

- **WHEN** the viewport is 375px wide
- **THEN** the grid shows 1 column with all 4 categories stacked vertically

### Requirement: Data source SHALL be content/skills.yml

The page SHALL read its data from `content/skills.yml` via `queryContent('skills').findOne()`, not from hard-coded values in the Vue file.

#### Scenario: Editing YAML reflects in UI

- **WHEN** a developer adds "Rust" to the `backend` list in `content/skills.yml` and rebuilds
- **THEN** the Backend column on the rendered page includes a "Rust" chip
