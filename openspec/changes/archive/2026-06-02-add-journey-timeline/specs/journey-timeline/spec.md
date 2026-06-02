## ADDED Requirements

### Requirement: Journey route SHALL render a vertical timeline

The `/journey` route SHALL render a two-column layout: a left column containing a vertical timeline with inline year labels, and a right column containing a static résumé/CV card. Uses `content` layout with `PageHeader`.

#### Scenario: Timeline renders all entries

- **WHEN** `content/timeline.yml` contains events from 2018 to 2026
- **THEN** the left column renders each entry with year label, `{company} · {role}` heading, description, and tag chips

### Requirement: Year ranges SHALL display in short format

When a timeline entry spans multiple years (`yearEnd` field present), the year label SHALL display as `{year} → {2-digit end}`.

#### Scenario: Multi-year entry displays range

- **WHEN** a timeline entry is `{ year: 2024, yearEnd: 25, ... }`
- **THEN** the year label renders as `2024 → 25`

### Requirement: Central vertical φ line SHALL serve as timeline spine

A 1px vertical line SHALL be positioned at the left edge of the timeline column, spanning the full content height, in `var(--ink)` color at reduced opacity.

#### Scenario: Spine renders at left edge of timeline

- **WHEN** the page is rendered at any width
- **THEN** a vertical 1px ink-colored line spans the timeline column at `left: 8px` with a small square marker per entry

### Requirement: Each event SHALL display year, company/role, description, and tags

Each timeline event from `content/timeline.yml` SHALL render: year label (Space Mono, 11px, uppercase), `{company} · {role}` (`font-mincho` 28px), description (`font-mono` 12px), and tag chips.

#### Scenario: Event with all fields renders correctly

- **WHEN** a timeline entry is `{ year: 2024, company: 'Hina', role: 'Lead Frontend Engineer', description: 'team of 4 · payments', tags: [vue, ts, payments] }`
- **THEN** the rendered event shows "2024" label, "Hina · Lead Frontend Engineer" heading, "team of 4 · payments" body, and three tag chips

### Requirement: Anchor links SHALL enable smooth scroll navigation

Each entry SHALL have `id="year-{year}"` for anchor-based navigation. `scroll-behavior: smooth` SHALL be set on `html`.

#### Scenario: Anchor scroll works

- **WHEN** the user navigates to `#year-2024`
- **THEN** the viewport smoothly scrolls to the 2024 entry

### Requirement: Right column SHALL display a static résumé card

The right column SHALL show a `résumé · cv` label, a bordered card with filename, PDF preview bars, download and preview buttons, and a handwritten note about alternative formats.
