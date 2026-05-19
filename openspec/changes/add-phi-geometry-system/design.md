## Context

The visual language relies on φ-anchored decorative lines on every page (Hero, About, Blog, Projects, etc.). Each page needs different line combinations. Coordinates must scale to arbitrary container sizes (responsive: 375 mobile, 768 tablet, 1280+ desktop). The component must work in SSG mode (Nuxt 3 prerender) without hydration mismatches.

## Goals / Non-Goals

**Goals:**
- A single reusable `<PhiLines>` component for the entire site
- Coordinates expressed declaratively (no per-page SVG boilerplate)
- SSR-safe (no client-only measurements)

**Non-Goals:**
- Animated lines (might add later but out of MVP scope)
- Theme-aware line color (stays `var(--ink)` for now; dark mode inverts via CSS Variable)

## Decisions

- **Fixed viewBox + `preserveAspectRatio="none"`**: SVG fills the parent container with `width: 100%; height: 100%`. Coordinates in viewBox space (0–100) map non-uniformly to the rendered size. Rationale: zero client-side measurement needed → SSG-safe. Alternative considered: `useElementSize` from VueUse to compute coords at runtime — rejected because it returns `{ 0, 0 }` during prerender, causing lines to render as points on the server then jump to position after hydration (visible flicker + hydration warning).
- **`lines` array as primary API, not `variant` prop**: Each page passes its own line set. Rationale: avoids a giant switch/case inside the component that grows with every new page. Alternative: pre-baked variants like `<PhiLines variant="hero-a" />` — rejected because the variant logic ends up duplicating the line definitions anyway, and reordering or tweaking a single line requires editing the component.
- **Coordinates accept percentage strings OR numbers**: Pages can write `y1: '38.2%'` for readability while still allowing pixel values for one-off cases.

## Risks / Trade-offs

- **Risk**: `preserveAspectRatio="none"` distorts the angle of diagonal lines in extreme aspect ratios → Mitigation: most pages use horizontal/vertical lines or near-horizontal diagonals where distortion is minor; for true diagonals, accept the trade-off (responsive scale matters more than precise angle)
- **Trade-off**: Each page writes its own array (no DRY). Acceptable: the site has <15 pages and line definitions are short
