## MODIFIED Requirements

### Requirement: Blog detail route SHALL render post content with TOC

The `/blog/[slug]` route SHALL render a three-column layout: TOC sidebar (180px), article body (flex), also-reading sidebar (180px). The article lede SHALL use `font-mincho text-[20px] leading-[1.5]`. Additionally, the bottom of the article SHALL display received Webmentions for the post URL (fetched from webmention.io).

#### Scenario: TOC is generated from headings

- **WHEN** the post body contains H2 / H3 headings
- **THEN** the TOC sidebar lists those headings as clickable anchor links

#### Scenario: TOC highlights active heading on scroll

- **WHEN** the user scrolls past a section heading
- **THEN** the corresponding TOC item gains opacity 1 while others have opacity 0.5

#### Scenario: Webmentions appear at article bottom

- **WHEN** webmention.io has received mentions for this post URL
- **THEN** the bottom of the article lists each mention with source URL and excerpt
