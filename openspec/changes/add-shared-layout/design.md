## Context

Every page on the site shares the same chrome (top nav + bottom footer) and reuses a set of decorative micro-components. Without a shared layout + atomic component library, each page would re-implement these and drift visually.

## Goals / Non-Goals

**Goals:**
- One `default` layout consumed by every page
- 5 reusable atomic components (TickWall, TagChip, GeoPortrait, plus SiteHeader/Footer)
- A visual reference page `/playground` for in-development QA

**Non-Goals:**
- Building SearchModal (deferred to `add-site-search`)
- Building any business-logic components (Hero, BlogList, etc.)
- Wf*-prefixed placeholder components from the wireframe (skipped per project decision)

## Decisions

- **Only build components that will survive in production**: The design file ships many `Wf*` placeholders (`<WfBar>`, `<WfImage>`, `<WfNote>`) that exist to mock text/images in the wireframe. We skip them — pages will use real text and `<img>` directly with Tailwind classes. Rationale: avoids building components we'd discard during real-content phases.
- **GeoPortrait replaces a real photo**: Used on `/about`. Composed of `var(--cool)` + `var(--bg)` rectangles in a φ-inspired tiling. Rationale: matches Japanese minimal aesthetic; no real photo asset needed for MVP; can be replaced with `<img>` later without touching layout.
- **Theme toggle lives in SiteHeader**: Uses `useColorMode()` from `@nuxtjs/color-mode`. Pill style matches design's `EN` pill for visual consistency.

## Risks / Trade-offs

- **Risk**: Nav has 7 items which may overflow on tablet → Mitigation: hide less-important items (`journey`, `skills`) under a "more" disclosure on smaller breakpoints; full mobile redesign deferred to per-page responsive work
- **Trade-off**: Hard-coded nav item list inside SiteHeader (not config-driven). Acceptable for a portfolio with stable IA
