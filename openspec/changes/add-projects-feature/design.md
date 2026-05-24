## Context

Projects are the differentiator for a backend-leaning engineer's portfolio. Each project needs structured metadata (role, team, stack) for skimming, plus a long-form case study with architecture diagrams.

## Goals / Non-Goals

**Goals:**
- Frontmatter-driven structured metadata
- Long-form case study via Markdown body
- Architecture diagrams via Mermaid (reused from `add-blog-feature`)
- Prev/next navigation between projects

**Non-Goals:**
- Grid / collage layouts (only `list` per MVP decision)
- Image gallery / lightbox (use simple `<img>` tags)

## Decisions

- **Frontmatter carries structured fields, body carries narrative**: Fields like `role`, `team`, `stack`, `cover`, `screens` go in YAML frontmatter; sections like "Brief", "Process", "Tech Decisions" live as Markdown headings in the body. Rationale: structured fields render in design-specific positions (sidebar, header grid); narrative flows naturally in the body.
- **Tech Decisions section is a Markdown convention, not a special component**: Authors write `## Tech Decisions` followed by paragraphs and a mermaid block. The page template doesn't enforce its presence. Rationale: flexibility for projects where it doesn't apply.
- **Shared `@nuxt/content` setup with `add-blog-feature`**: If `add-blog-feature` is implemented first, this change reuses the existing module. Otherwise this change installs and configures it.

## Risks / Trade-offs

- **Risk**: Cover images add page weight → Mitigation: enforce `.jpg` or `.webp`; use Nuxt's `<NuxtImg>` for automatic optimization
- **Trade-off**: Prev/next computed via `queryContent` sort — relies on stable ordering. Use `date` frontmatter field as sort key; on tie, fallback to filename alphabetical
