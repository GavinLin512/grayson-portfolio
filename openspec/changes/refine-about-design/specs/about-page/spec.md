## MODIFIED Requirements

### Requirement: About route SHALL render AboutPage layout

The `/about` route SHALL render a two-column editorial layout:
- **Left column**: `<HatchPortrait>` (320×320 desktop / 240×240 mobile) at the top + Caveat caption "— grayson, somewhere in taipei." pushed to the column's bottom edge.
- **Right column**: a `font-mincho text-[42px] leading-[1.15]` headline at the top, followed by a measure-bars decoration (2 rows of horizontal `var(--line)` rectangles), followed by a 2×2 snapshot grid.
- **Page label** (top-left): "— 06 / about" in `font-mono text-[14px] opacity-60`.
- **No background φ line**.

#### Scenario: Two-column layout on desktop

- **WHEN** the viewport is ≥ 1024px wide
- **THEN** the page shows HatchPortrait + bottom-aligned Caveat caption on the left, and headline + measure bars + snapshot grid on the right, side-by-side

#### Scenario: Mobile collapses to single column

- **WHEN** the viewport is < 768px
- **THEN** the columns stack vertically; HatchPortrait scales to 240×240; the snapshot grid stays 2-column or collapses to 1-column per viewport budget

#### Scenario: Page label is visible

- **WHEN** the page is rendered
- **THEN** the top-left corner shows "— 06 / about" using `font-mono text-[14px]` at reduced opacity

### Requirement: Portrait area SHALL be a wireframe placeholder

The portrait area SHALL be rendered by a `<HatchPortrait>` component composed of:
- A square outer frame with `1px solid var(--line)` border
- An interior fill of diagonal hatching (45° repeating lines using `var(--line)` at low opacity)
- A centered label box (~70×40px, border 1px ink, font-mono text-[11px], background `var(--bg)`) containing the text "portrait"

#### Scenario: Hatch pattern is visible

- **WHEN** the portrait renders
- **THEN** the interior shows 45° diagonal lines spaced ~6–8px apart at reduced opacity

#### Scenario: Center label is centered both axes

- **WHEN** the portrait renders at any size
- **THEN** the "portrait" label box is centered horizontally and vertically within the frame

### Requirement: Right column SHALL include measure-bars decoration

The space between the headline and the snapshot grid SHALL be filled by a 2-row measure-bars decoration:
- Row 1: three horizontal bars with widths 40% / 30% / 20% of the column
- Row 2: two horizontal bars with widths 35% / 30%
- Bar height: 14px; horizontal gap: 6px; vertical row gap: 10px
- Background: `var(--line)` (or `var(--ink)` at ≤ 0.2 opacity)

#### Scenario: Bars render between headline and grid

- **WHEN** the right column renders
- **THEN** the user sees 5 horizontal bars in 2 rows positioned between the `<h1>` and the snapshot grid

### Requirement: About page SHALL include a 2×2 snapshot grid

The right column SHALL include a 2-column × 2-row snapshot grid with the following entries (label in `font-mono text-[11px] opacity-60 lowercase`, body in `font-mono text-[12px] leading-[1.55] opacity-85`):

| | Column 1 | Column 2 |
|---|---|---|
| **Row 1** | `now` — current activity | `previously` — prior roles |
| **Row 2** | `elsewhere` — contact / external profiles (including `cv · /resume.pdf`) | `away from screens` — personal interests |

Grid spacing: `gap-x-[40px] gap-y-[28px]`.

#### Scenario: Snapshot grid renders 4 cells

- **WHEN** the page is rendered
- **THEN** the right column shows exactly 4 cells with the labels `now`, `previously`, `elsewhere`, `away from screens` in 2 columns × 2 rows

#### Scenario: Snapshot is NOT a career timeline

- **WHEN** comparing About snapshot with `/journey`
- **THEN** About shows single-line snapshots (current state, key references), NOT a chronological list of every role; full timeline lives on `/journey`

#### Scenario: Resume link lives inside elsewhere

- **WHEN** the user reads the `elsewhere` cell
- **THEN** the cell contains a `cv · /resume.pdf` entry that links to the downloadable PDF; no separate prominent "Download CV" button exists on the page

### Requirement: Resume PDF SHALL be downloadable

The file `public/resume.pdf` SHALL exist. The page SHALL link to it from inside the `elsewhere` snapshot cell using a `font-mono text-[12px]` underlined link.

#### Scenario: Download link triggers PDF retrieval

- **WHEN** the user clicks the `/resume.pdf` link inside `elsewhere`
- **THEN** the browser navigates to `/resume.pdf` and the file is served (even if placeholder content)

## REMOVED Requirements

### Requirement: About page SHALL NOT include now/previously sections

**Reason**: Original spec assumed all career-adjacent content belongs to `/journey`. After visual design was finalized, About reclaims a compact *snapshot* (not timeline) of now/previously/elsewhere/away-from-screens. The new requirement "About page SHALL include a 2×2 snapshot grid" defines the boundary: snapshot single-liners on About; full chronological timeline on `/journey`.

**Migration**: No data migration; this requirement was a behavioral restriction. The new snapshot grid replaces the prose paragraphs from the previous implementation.
