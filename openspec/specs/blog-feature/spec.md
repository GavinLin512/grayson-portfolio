## ADDED Requirements

### Requirement: Blog list route SHALL display posts from content/blog

The `/blog` route SHALL list posts authored as Markdown files under `content/blog/`, displayed in a two-column layout (`grid-cols-[1.4fr_1fr]`): main column with the post list, side column with pinned posts and yearly archive.

#### Scenario: Posts are listed by date descending

- **WHEN** the page is rendered with multiple posts in `content/blog/`
- **THEN** posts appear sorted by frontmatter `date` field in descending order

#### Scenario: Each post entry shows required metadata

- **WHEN** a post entry is rendered
- **THEN** the entry displays: date (label), reading time (label), title (`font-mincho text-[24px]`), and tag chip(s)

### Requirement: Blog detail route SHALL render post content with TOC

The `/blog/[slug]` route SHALL render a three-column layout: TOC sidebar (180px), article body (flex), also-reading sidebar (180px). The article lede SHALL use `font-mincho text-[20px] leading-[1.5]`.

#### Scenario: TOC is generated from headings

- **WHEN** the post body contains H2 / H3 headings
- **THEN** the TOC sidebar lists those headings as clickable anchor links

#### Scenario: TOC highlights active heading on scroll

- **WHEN** the user scrolls past a section heading
- **THEN** the corresponding TOC item gains opacity 1 while others have opacity 0.5

### Requirement: Mermaid code blocks SHALL render as diagrams

A fenced code block with language `mermaid` SHALL be rendered as a Mermaid diagram, not as a syntax-highlighted code listing.

#### Scenario: Mermaid block becomes a diagram

- **WHEN** a Markdown file contains ` ```mermaid\ngraph LR; A --> B\n``` `
- **THEN** the rendered HTML contains an SVG diagram with two nodes connected by an arrow

### Requirement: Reading time SHALL be estimated from word count

The system SHALL compute reading time in minutes by dividing the post's word count by 200, rounded up to the nearest integer.

#### Scenario: 6-minute post

- **WHEN** a post body contains approximately 1100 words
- **THEN** the displayed reading time is "6 min"

### Requirement: RSS feed SHALL be available at /rss.xml

The system SHALL serve a valid RSS 2.0 feed at `/rss.xml` containing all blog posts with title, link, pub date, and description.

#### Scenario: Feed validates as RSS 2.0

- **WHEN** a feed validator fetches `/rss.xml`
- **THEN** the response is valid RSS 2.0 XML containing one `<item>` per post

### Requirement: Tag filter SHALL be available in blog list

The blog list SHALL display a chip filter row with options `['all', 'css', 'type', 'craft', 'motion', 'meta']`. Selecting a chip SHALL filter the list to posts containing that tag in frontmatter.

#### Scenario: Filtering by tag

- **WHEN** the user clicks the "css" chip
- **THEN** only posts with `tags: [css, ...]` in frontmatter are shown
