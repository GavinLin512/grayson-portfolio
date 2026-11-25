## ADDED Requirements

### Requirement: Comment dates SHALL be formatted for the current locale

The comments list SHALL format each comment's date with `Intl.DateTimeFormat` in the current locale (`year: 'numeric', month: 'short', day: 'numeric'`), instead of always using `en-US`.

#### Scenario: Date on a Chinese page

- **WHEN** a comment from 2026-11-25 is shown on `/blog/<slug>`
- **THEN** its date reads `2026年11月25日`

#### Scenario: Date on an English page

- **WHEN** the same comment is shown on `/en/blog/<slug>`
- **THEN** its date reads `Nov 25, 2026`
