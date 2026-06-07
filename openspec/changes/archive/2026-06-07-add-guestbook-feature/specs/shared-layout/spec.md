## MODIFIED Requirements

### Requirement: SiteFooter SHALL display copyright and slogan

`<SiteFooter>` SHALL render at 36px height containing: copyright (`© 2026 — grayson · index 00`) on the left, slogan (`— a portfolio in beige`) in the middle, and a guestbook navigation link (`guestbook →`, a `<NuxtLink to="/guestbook">`) on the right. The link replaces the previous static `scroll ↓` text, giving the guestbook its navigation entry point.

#### Scenario: Footer renders all three sections

- **WHEN** any page is rendered
- **THEN** the footer DOM contains three child elements: copyright text, slogan text, and a link to `/guestbook`

#### Scenario: Guestbook link navigates to the guestbook

- **WHEN** a visitor clicks the `guestbook →` link in the footer
- **THEN** the browser navigates to `/guestbook`
