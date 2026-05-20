## MODIFIED Requirements

### Requirement: Hero auxiliary text SHALL be at minimum 15px

All non-title text on the Hero page SHALL have a font-size of at least 15px. The Mincho big title (`text-[64px]` / `text-[96px]` / `text-[144px]`) is exempt.

Previous values: left-side paragraph `12px`, `N°` date label `11px`, `a portfolio —` subtitle `12px`, `design · code · craft` tagline `11px`.

#### Scenario: Left-side paragraph is readable

- **WHEN** the viewport is ≥ 1280px wide
- **THEN** the left-side paragraph (`— 01 / hello.`) has `font-size` of `16px`

#### Scenario: Date label is readable

- **WHEN** the viewport is ≥ 1280px wide
- **THEN** the `N° 2026 — 04` label has `font-size` of `15px`

#### Scenario: Title subtitle and tagline are readable

- **WHEN** the page is rendered at any viewport
- **THEN** `a portfolio —` renders at `16px` and `design · code · craft / 2018 → 2026` renders at `15px`

### Requirement: Hero SHALL fill the viewport without scroll overflow

The Hero page SHALL occupy exactly the available space between `<SiteHeader>` and `<SiteFooter>` with no vertical or horizontal scrollbar.

Previous behaviour: `min-h-screen` on the Hero container caused total page height to exceed 100vh.

#### Scenario: No scrollbar at desktop

- **WHEN** the viewport is 1280×800
- **THEN** neither `document.documentElement.scrollHeight` exceeds `window.innerHeight` nor a horizontal scrollbar is visible

#### Scenario: No scrollbar at mobile

- **WHEN** the viewport is 375×667
- **THEN** neither vertical nor horizontal scrollbar appears on the Hero route
