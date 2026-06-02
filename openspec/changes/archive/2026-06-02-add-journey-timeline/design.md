## Context

The journey page narrates career history on its own URL, separated from About. Vertical timeline matches resume conventions; the wireframe's variant B (vertical sidebar layout) was chosen over variant A (horizontal φ-diagonal spine).

## Goals / Non-Goals

**Goals:**
- Chronological narrative with clear year markers
- Jump-to-year navigation via sidebar
- Visual coherence with site (one φ line for spine)

**Non-Goals:**
- Logo / image per company (text only)
- Horizontal φ-axis variant (only vertical)
- Detail expansion per event (one paragraph per event is enough)

## Decisions

- **YAML data source over Markdown**: Same rationale as `add-skills-page` — typed shape, easy edits
- **`content` layout (not `default`)**: Screenshot reference shows PageHeader + standard padding, consistent with about / skills pages
- **Inline year per entry (not 180px sidebar)**: Screenshot shows year label inline with each timeline entry; no separate sidebar navigation panel
- **`yearEnd` optional field**: Year ranges like `2024 → 25` are stored as `year: 2024, yearEnd: 25`; display formatted as `{year} → {2-digit end}`
- **Right column: résumé CV card**: Screenshot shows a static PDF card on the right half; not in original spec but added for visual completeness
- **φ spine at left edge of timeline column**: Positioned at `left: 8px` of the timeline div (not `38.2%` of page width as originally spec'd); matches screenshot
- **`scroll-behavior: smooth` CSS**: Native browser API, no JS library

## Risks / Trade-offs

- **Risk**: Long timeline becomes tall page → Mitigation: optional "show before 2020" toggle could be added later; for MVP just show all
- **Trade-off**: Vertical layout means timeline events can't be visually compared side-by-side. Acceptable: visitors typically scan chronologically anyway
