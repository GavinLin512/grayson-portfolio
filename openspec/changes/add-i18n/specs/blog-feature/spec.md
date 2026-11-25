## MODIFIED Requirements

### Requirement: Blog list route SHALL display posts from content/blog

The `/blog` route SHALL list the zh-TW posts authored as Markdown files under `content/blog/`, and the `/en/blog` route SHALL list the English posts under `content/i18n/en/blog/`, each displayed in a two-column layout (`grid-cols-[1.4fr_1fr]`): main column with the post list, side column with a **single featured pinned card** and an **inline yearly archive**. A post and its translation SHALL share the same file name and therefore the same slug.

#### Scenario: Posts are listed by date descending

- **WHEN** the page is rendered with multiple posts in `content/blog/`
- **THEN** posts appear sorted by frontmatter `date` field in descending order

#### Scenario: Each locale lists its own posts

- **WHEN** `/en/blog` is rendered
- **THEN** it lists the posts under `content/i18n/en/blog/` and none of the zh-TW posts

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

The `/blog/[slug]` route SHALL render the zh-TW post and the `/en/blog/[slug]` route SHALL render the English post with the same slug, in a three-column layout: TOC sidebar (180px), article body (flex), also-reading sidebar (180px). The also-reading sidebar SHALL only list posts of the same locale. A slug without a post in the requested locale SHALL render the not-found page, not the other locale's post. The article lede SHALL use `font-mincho text-[20px] leading-[1.5]`.

#### Scenario: TOC is generated from headings

- **WHEN** the post body contains H2 / H3 headings
- **THEN** the TOC sidebar lists those headings as clickable anchor links

#### Scenario: TOC highlights active heading on scroll

- **WHEN** the user scrolls past a section heading
- **THEN** the corresponding TOC item gains opacity 1 while others have opacity 0.5

#### Scenario: English post at /en

- **WHEN** a visitor opens `/en/blog/2026-11-04-agents-md-hijack-defense`
- **THEN** the English version from `content/i18n/en/blog/` is rendered with `<html lang="en">`

#### Scenario: No silent fallback to the other language

- **WHEN** a visitor opens `/en/blog/<slug>` for a post that exists only in zh-TW
- **THEN** the not-found page is rendered

### Requirement: RSS feed SHALL be available at /rss.xml

The system SHALL serve a valid RSS 2.0 feed at `/rss.xml` containing all zh-TW posts and at `/en/rss.xml` containing all English posts, each with title, link (in its own locale), pub date, and description, and a `<language>` of `zh-TW` and `en` respectively.

#### Scenario: Feed validates as RSS 2.0

- **WHEN** a feed validator fetches `/rss.xml`
- **THEN** the response is valid RSS 2.0 XML containing one `<item>` per zh-TW post and `<language>zh-TW</language>`

#### Scenario: English feed links to English posts

- **WHEN** a feed reader fetches `/en/rss.xml`
- **THEN** every `<item>` links to a `/en/blog/...` URL
