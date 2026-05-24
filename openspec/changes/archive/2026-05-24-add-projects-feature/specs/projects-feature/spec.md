## ADDED Requirements

### Requirement: Projects list route SHALL display all projects

The `/projects` route SHALL render a list of projects authored as Markdown files under `content/projects/`, each entry showing: zero-padded index number, title (`font-mincho`), one-line subtitle, stack chips, and a link.

#### Scenario: Each project entry shows required fields

- **WHEN** the page is rendered with a project entry
- **THEN** the entry shows index (e.g. `02`), title, subtitle, stack chips, and a link to the detail page

#### Scenario: List rows are visually separated

- **WHEN** multiple entries are rendered
- **THEN** each row has a `1px solid var(--line)` bottom border

### Requirement: Project detail route SHALL render the full case study

The `/projects/[slug]` route SHALL render a three-column header (`grid-cols-[70px_1fr_200px]`), full-width cover image (420px tall), a `[1fr_2fr]` role/stack + brief/process section, a `[2fr_1fr]` dual-image section (with the second image styled `bg-cool`), a "Tech Decisions" section embedding a Mermaid diagram, and prev/next navigation.

#### Scenario: Frontmatter populates structured fields

- **WHEN** a project's frontmatter is `{ title, subtitle, year, role, team, stack, cover, screens }`
- **THEN** those fields render in their designated positions on the detail page

#### Scenario: Tech Decisions section embeds Mermaid

- **WHEN** the Markdown body contains a `## Tech Decisions` heading followed by a `mermaid` code block
- **THEN** the rendered page shows the Mermaid diagram inside the Tech Decisions section

#### Scenario: Prev/next navigation works

- **WHEN** the user is on the second of three projects
- **THEN** the bottom of the page shows a "← previous" link to project 1 and a "next →" link to project 3

### Requirement: Routes SHALL be statically prerendered

Both `/projects` and `/projects/[slug]` SHALL be prerendered at build time.

#### Scenario: Build outputs static HTML for each project

- **WHEN** `pnpm build` is executed with 2 projects in `content/projects/`
- **THEN** `.output/public/projects/index.html` exists and `.output/public/projects/[slug-of-each]/index.html` exists for both
