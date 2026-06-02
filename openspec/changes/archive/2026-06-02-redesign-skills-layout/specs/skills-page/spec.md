## MODIFIED Requirements

### Requirement: Skills route SHALL render a 4-column grid

The `/skills` route SHALL render a 4-column CSS grid (`lg:grid-cols-4`) on desktop driven by the `categories` array in `content/skills.yml`. The four columns SHALL be **vertically staggered** (each column offset by a different top margin at the `lg` breakpoint) to match `uiux-fix/skills.png`; below `lg` the offsets SHALL be removed. The header label SHALL read `— 05 / what i carry in the toolbox`.

#### Scenario: Desktop renders 4 staggered columns

- **WHEN** the viewport is ≥ 1024px wide
- **THEN** the grid shows 4 columns, one per `categories` entry, with differing top offsets (column 2 sitting lowest)

#### Scenario: Header label matches design

- **WHEN** the page renders
- **THEN** the PageHeader shows `— 05 / what i carry in the toolbox`

### Requirement: Each category column SHALL show a numbered label and a skill row list

A category column SHALL contain: a numbered label `0N / label` (Space Mono) above a `border-t border-line`, followed by a list of skill rows. Each skill row SHALL show the skill name (serif, ≈18px) on the LEFT and a 5-cell proficiency meter on the RIGHT, with a `border-b border-dotted border-line` separating rows. Columns SHALL NOT use `<TagChip>` pills.

#### Scenario: Languages column renders rows with meters

- **WHEN** `content/skills.yml` has a category `{ index: "01", label: languages, skills: [{name: typescript, level: 5}, ...] }`
- **THEN** the column shows the label `01 / languages`, a top border, and one row per skill — each with the serif name and a 5-cell meter — separated by dotted underlines

#### Scenario: Chips are not used

- **WHEN** a category column is rendered
- **THEN** it SHALL NOT render rounded `<TagChip>` pills

### Requirement: Skills route SHALL be responsive

The grid SHALL collapse to 2 columns at tablet (`md`, 768–1023px) and 1 column at mobile (< 768px). Staggered top offsets SHALL apply only at `lg` and above; at `md` and below all columns SHALL align to the same top.

#### Scenario: Tablet shows 2 aligned columns

- **WHEN** the viewport is 768px wide
- **THEN** the grid shows 2 columns with no stagger offset

#### Scenario: Mobile shows 1 column

- **WHEN** the viewport is 375px wide
- **THEN** the grid shows 1 column with all categories stacked vertically and no stagger offset

### Requirement: Data source SHALL be content/skills.yml

The page SHALL read its data from `content/skills.yml` via `queryCollection('skills').first()`. The YAML SHALL define `header`, a `categories` array (each with `index`, `label`, and a `skills` array of `{ name, level }`), and the strings `currentlyLearning` and `notInterested`. The `content.config.ts` `skills` collection schema SHALL enforce this shape, with `level` constrained to 0–5.

#### Scenario: Editing YAML reflects in UI

- **WHEN** a developer changes a skill's `level` from 4 to 5 in `content/skills.yml` and rebuilds
- **THEN** that skill's meter renders 5 filled cells instead of 4

#### Scenario: Build fails on invalid level

- **WHEN** a skill declares `level: 7`
- **THEN** `pnpm build` SHALL fail with a schema validation error

## ADDED Requirements

### Requirement: Each skill SHALL display a 5-cell proficiency meter

Each skill row SHALL render a meter of 5 fixed cells via a `SkillMeter` component. The first `level` cells SHALL be filled (`bg-ink`) and the remaining cells SHALL be empty/outlined (`border border-ink`). The meter SHALL carry an accessible label describing the level.

#### Scenario: Level 4 renders four filled cells

- **WHEN** a skill has `level: 4`
- **THEN** the meter shows 4 filled cells and 1 outlined cell, with an `aria-label` such as `4 of 5`

#### Scenario: Level 5 renders all cells filled

- **WHEN** a skill has `level: 5`
- **THEN** the meter shows 5 filled cells

### Requirement: Skills page SHALL show currently-learning and not-interested notes

Below the category grid the page SHALL render two annotation blocks in handwriting font (`font-hand`): one labelled `currently learning` showing `currentlyLearning`, and one labelled `not interested in` showing `notInterested`. The blocks SHALL align horizontally to the first and third columns respectively.

#### Scenario: Both notes render from YAML

- **WHEN** `currentlyLearning` is `rust · webgpu · WAI-ARIA practices '26` and `notInterested` is `moving fast and breaking things.`
- **THEN** the page shows a `currently learning` note with the first string and a `not interested in` note with the second, both in handwriting font

## REMOVED Requirements

### Requirement: Each category column SHALL show category label, chip cluster, and Caveat note

**Reason**: Replaced by numbered-label + skill-row-list (with proficiency meters) and the two shared annotation blocks. Per-column chip clusters and per-column Caveat notes no longer match the design.

**Migration**: `content/skills.yml` migrates from 4 string arrays to the `categories` shape; `app/pages/skills.vue` stops using `<TagChip>` and per-column `caveat` strings.
