## ADDED Requirements

### Requirement: Journey route SHALL render a vertical timeline

The `/journey` route SHALL render a two-column layout: a fixed-width left sidebar (180px) containing a year index, and a main column with chronological events.

#### Scenario: Sidebar lists all years from timeline.yml

- **WHEN** `content/timeline.yml` contains events from 2018 to 2026
- **THEN** the sidebar shows each unique year (2026, 2024, 2022, ...) as a clickable item

### Requirement: Central vertical φ line SHALL serve as timeline spine

A 1px vertical line SHALL be positioned at `x = 38.2%` of the page width, spanning the full content height, in `var(--ink)` color.

#### Scenario: Spine renders at the φ position

- **WHEN** the page is rendered at any width
- **THEN** a vertical 1px ink-colored line spans the timeline content area at 38.2% horizontal position

### Requirement: Each event SHALL display year, company/role, description, and tags

Each timeline event from `content/timeline.yml` SHALL render: year (label), `{company} · {role}` (`font-mincho`), description (`font-mono note`), and tag chips.

#### Scenario: Event with all fields renders correctly

- **WHEN** a timeline entry is `{ year: 2024, company: 'Hina', role: 'Lead Frontend Engineer', description: 'Built payments console', tags: [vue, ts, payments] }`
- **THEN** the rendered event shows "2024" label, "Hina · Lead Frontend Engineer" headline, "Built payments console" body, and three tag chips

### Requirement: Year sidebar click SHALL scroll to corresponding event

Clicking a year in the sidebar SHALL smooth-scroll the viewport to the first event of that year.

#### Scenario: Click year jumps to event

- **WHEN** the user clicks "2024" in the sidebar
- **THEN** the viewport smoothly scrolls so the first 2024 event aligns near the top of the visible area
