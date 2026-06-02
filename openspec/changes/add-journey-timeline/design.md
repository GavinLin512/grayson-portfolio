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
- **Sidebar year list shows year + count**: e.g., "2024 (3 events)". Helps the visitor gauge depth at each year
- **`scroll-behavior: smooth` CSS**: Native browser API, no JS library

## Risks / Trade-offs

- **Risk**: Long timeline becomes tall page → Mitigation: optional "show before 2020" toggle could be added later; for MVP just show all
- **Trade-off**: Vertical layout means timeline events can't be visually compared side-by-side. Acceptable: visitors typically scan chronologically anyway
