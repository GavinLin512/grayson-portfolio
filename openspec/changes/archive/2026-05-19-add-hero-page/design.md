## Context

The Hero A variant is the entry point of the portfolio. From the design file's 4 hero variants (A horizontal-φ, B φ-cross, C wall+bold-φ, D φ-axis-with-ticks), we chose A for its calm horizontal rhythm and clean mobile adaptability.

## Goals / Non-Goals

**Goals:**
- Pixel-fidelity to Hero A artboard within ±2px on desktop
- Graceful responsive behavior at 375 / 768 / 1280
- SSG prerender so the initial paint is instant

**Non-Goals:**
- "Featured projects" section below the hero (deferred per MVP decision — index page is just the hero)
- Hover/scroll animations (out of MVP)
- Other hero variants (B/C/D) — only A

## Decisions

- **Absolute positioning for all hero elements**: Each element uses `absolute left-[60px] top-[X]` or `right-[60px] bottom-[Y]`. Rationale: matches the design file's exact placement, easier to verify pixel-by-pixel. Alternative: CSS grid — rejected because the layout is fundamentally a "anchor things to corners of a viewport" composition.
- **TickWall count 5**: Per design file `<TickWall x={60} y={380} count={5} length={56} gap={16} />`. The `every 3rd is shorter` rule is encoded in the TickWall component itself (from `add-shared-layout`).
- **Viewport height**: hero uses `min-h-screen` so the hero always fills the viewport regardless of device. Footer pushes below the fold.

## Risks / Trade-offs

- **Risk**: 144px title may overflow on narrow desktops (~1024px) → Mitigation: `lg:text-[96px] xl:text-[144px]` to scale down for smaller desktops
- **Risk**: Absolute positioning ignores accessibility tab order → Mitigation: ensure DOM source order matches reading order (note → title → tickwall)
