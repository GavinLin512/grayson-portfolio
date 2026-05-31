## ADDED Requirements

### Requirement: Blog list route SHALL display posts from content/blog

The `/blog` route SHALL list posts authored as Markdown files under `content/blog/`, displayed in a two-column layout (`grid-cols-[1.4fr_1fr]`): main column with the post list, side column with a **single featured pinned card** and an **inline yearly archive**.

#### Scenario: Posts are listed by date descending

- **WHEN** the page is rendered with multiple posts in `content/blog/`
- **THEN** posts appear sorted by frontmatter `date` field in descending order

#### Scenario: Each post entry shows required metadata

- **WHEN** a post entry is rendered
- **THEN** the entry displays:
  - a top metadata row with date formatted `YYYY · MM · DD` on the left and `{N} min` reading time on the right (mono, opacity-55)
  - title (`font-mincho text-[24px]`)
  - tag chip(s) and a decorative gray meter bar (`h-[6px] bg-ink/15`) in a single row, where the meter width = `min(readingTime × 30, 240)` px

#### Scenario: Meter bar is decorative only

- **WHEN** the meter bar is rendered
- **THEN** it has `aria-hidden="true"` and conveys no semantic information beyond visual density

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

The blog list SHALL display a chip filter row with options `['all', 'css', 'type', 'craft', 'motion', 'meta']`. Each filter button SHALL render as a **pill chip** with the following CSS contract:

- shape: `rounded-full border border-ink`
- typography: `font-mono text-[12px] leading-none uppercase tracking-wider`
- padding: `px-[14px] py-[4px]`
- total box height ≤ PageHeader label box height (~22.5px) so the underline beneath PageHeader stays aligned with other pages

The active filter SHALL be visually distinguished by an **inverted fill** (`bg-ink text-bg`); inactive filters use `opacity-70`. Selecting a chip SHALL filter the list to posts containing that tag in frontmatter.

#### Scenario: Filtering by tag

- **WHEN** the user clicks the "css" chip
- **THEN** only posts with `tags: [css, ...]` in frontmatter are shown
- **AND** the "css" chip renders with inverted fill (`bg-ink text-bg`)
- **AND** all other chips render with `opacity-70`

#### Scenario: Default active filter

- **WHEN** the page first renders
- **THEN** the "all" chip is active (inverted fill) and all posts are visible

### Requirement: Pinned card SHALL feature a single latest post

The side column SHALL render a `pinned` card containing exactly one post: the most-recent post with `pinned: true` in frontmatter. If no post has `pinned: true`, the card SHALL NOT render.

#### Scenario: Pinned card contents

- **WHEN** a post with `pinned: true` exists
- **THEN** the card displays:
  - "pinned" label (mono 11px uppercase, opacity-50)
  - date in `YYYY · MM · DD` format
  - title (`font-mincho text-[20px]`)
  - two horizontal meter bars (widths 100% and 80%, `h-[6px] bg-ink/15`)
  - "read →" link navigating to the post's path

#### Scenario: No pinned posts

- **WHEN** no post in `content/blog/` has `pinned: true`
- **THEN** the pinned card is omitted from the DOM

### Requirement: Archive SHALL display inline year counts

The side column SHALL include an `archive · by year` section listing each year that has posts, with the post count in parentheses, rendered inline on a single flex row (wrap on narrow widths).

#### Scenario: Inline year counts

- **WHEN** posts exist for years 2026 (12 posts), 2025 (10 posts), 2024 (8 posts)
- **THEN** the archive section renders: `2026 (12)  2025 (10)  2024 (8)` as inline mono 12px text, descending year order

#### Scenario: Year list omits years with no posts

- **WHEN** no posts exist for year 2023
- **THEN** "2023" does not appear in the archive list

### Requirement: RSS link SHALL be labelled with /feed.xml

The side column SHALL include a link labelled `rss · /feed.xml` (mono 12px, opacity-50) pointing to the site's RSS feed endpoint. The link SHALL display a `Rss` icon from `@lucide/vue` (14px, `stroke-width=2`, `currentColor`) immediately before the text, with `gap-[8px]` between icon and label.

#### Scenario: RSS link label

- **WHEN** the blog list page is rendered
- **THEN** the visible text reads `rss · /feed.xml` regardless of the underlying `href` route
- **AND** a Lucide `Rss` SVG icon is rendered as the first child of the anchor

### Requirement: useReadingTime SHALL parse Nuxt Content v3 minimark AST

The `useReadingTime` composable SHALL extract text from `body` values shaped as Nuxt Content v3 minimark (`{ type: 'minimark', value: Array<[tag, attrs, ...children]> }`) in addition to legacy hast / MDC AST. Word count SHALL equal the whitespace-separated token count of the extracted text; reading time SHALL be `Math.ceil(wordCount / 200)` minutes.

#### Scenario: Minimark body produces non-zero reading time

- **WHEN** `body = { type: 'minimark', value: [['p', {}, 'word '.repeat(800)]] }`
- **THEN** `useReadingTime(body)` returns `4`

#### Scenario: Legacy hast body still supported

- **WHEN** `body = { children: [{ type: 'text', value: 'word '.repeat(200) }] }`
- **THEN** `useReadingTime(body)` returns `1`
