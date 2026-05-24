## ADDED Requirements

### Requirement: About route SHALL render AboutPage layout

The `/about` route SHALL render a two-column layout:
- Left column: `<GeoPortrait>` (400×460) + Caveat caption "— grayson, somewhere in taipei."
- Right column: `font-mincho text-[42px] leading-[1.15]` headline + body paragraphs in `font-mono`
- One diagonal φ line as background decoration

#### Scenario: Two-column layout on desktop

- **WHEN** the viewport is ≥ 1024px wide
- **THEN** the page shows GeoPortrait on the left and headline/paragraphs on the right side-by-side

#### Scenario: Mobile collapses to single column

- **WHEN** the viewport is < 768px
- **THEN** the columns stack vertically; GeoPortrait scales to 60% of its desktop width

### Requirement: Resume PDF SHALL be downloadable

The page SHALL include a `<a href="/resume.pdf">` download button with `border: 1px solid var(--ink)` styling. The file `public/resume.pdf` SHALL exist.

#### Scenario: Download button triggers PDF download

- **WHEN** the user clicks the "Download CV" button
- **THEN** the browser navigates to `/resume.pdf` and the file is served (even if placeholder content)

### Requirement: About page SHALL NOT include now/previously sections

The page SHALL omit the "now / previously / elsewhere" content blocks shown in the original wireframe; career history is owned by the `/journey` route.

#### Scenario: No career list on About

- **WHEN** the page is rendered
- **THEN** no "now", "previously", or "elsewhere" headings appear; only the headline and body paragraphs
