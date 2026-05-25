## Context

The blog is the core content surface for the portfolio. It needs to support technical posts with code blocks, diagrams (Mermaid), and discoverability (RSS, tag filtering, TOC). Authoring must be Markdown-only for diff-friendly version control.

## Goals / Non-Goals

**Goals:**
- Markdown-authored posts via `@nuxt/content` v3
- Mermaid diagram rendering inline
- RSS feed for syndication
- TOC + active-section highlighting in detail view
- Tag-based filtering in list view

**Non-Goals:**
- MDX support (decision: pure Markdown is enough)
- Comments (Webmentions handles this; deferred to `add-deployment-pipeline`)
- Search (handled by `add-site-search`)

## Decisions

- **`@nuxt/content` v3 over MDX**: Decision was confirmed pre-build — we only need fenced code blocks + Mermaid; embedded Vue components are unnecessary. Rationale: simpler authoring, fewer build-time gotchas.
- **Mermaid via prose component override**: Use `@nuxt/content`'s `<ProseCode>` slot to intercept `language-mermaid` and render via the `mermaid` npm package on the client. Rationale: keeps post Markdown clean (no special syntax) and works with SSG.
- **Reading time computed at build, not at render**: Use a Nitro transformer or a `composables/useReadingTime.ts` invoked when displaying. Either works; we pick composable for simplicity.
- **TOC anchor scrolling uses native `scroll-behavior: smooth`**: No JS library; CSS only.

## Risks / Trade-offs

- **Risk**: Mermaid bundle (~600KB) loaded on detail page → Mitigation: dynamic import only when Mermaid blocks exist in the post; lazy-loaded with `import()` so list page is unaffected
- **Risk**: RSS feed re-generated at build time only, no incremental update → Acceptable for personal blog cadence
- **Trade-off**: Tag filter is client-side JS; users with JS disabled see all posts. Acceptable for a developer portfolio
