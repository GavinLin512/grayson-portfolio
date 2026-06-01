## Context

About page introduces the person behind the portfolio. The wireframe had now/previously/elsewhere content blocks, but we separated career history into `/journey` to keep About focused on identity + Resume entry point.

## Goals / Non-Goals

**Goals:**
- Personality-forward single page with portrait + headline + brief paragraph + Resume download
- Visual coherence with the φ + mincho design system

**Non-Goals:**
- Career timeline (lives in `/journey`)
- Real-photo portrait (use GeoPortrait geometric placeholder instead)

## Decisions

- **Geometric portrait over real photo**: `<GeoPortrait>` composed of cool + bg rectangles. Rationale: matches Japanese minimal aesthetic; no real photo asset blocks MVP; user can replace with `<img>` later without touching layout
- **Headline copy stays English**: `Grayson's Portfolio.` brand voice is English; i18n deferred post-MVP
- **Resume PDF placeholder is acceptable for MVP**: A 1px empty PDF can ship if real CV isn't ready; the download UX works regardless

## Risks / Trade-offs

- **Risk**: Empty placeholder PDF embarrasses visitors who download it → Mitigation: at minimum, ship a one-page CV summary before going public
- **Trade-off**: No social proof / testimonials. Acceptable for MVP; can add later via blog or projects page
