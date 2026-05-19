## ADDED Requirements

### Requirement: CSS Variables SHALL define color tokens for light and dark themes

The system SHALL define CSS custom properties `--bg`, `--paper`, `--ink`, `--ink2`, `--line`, `--cool`, `--warm` on `:root` (light) and on `.dark` selector (dark mode).

#### Scenario: Light theme tokens are applied by default

- **WHEN** the page loads in a browser with `prefers-color-scheme: light` or no preference
- **THEN** `getComputedStyle(document.documentElement).getPropertyValue('--bg')` returns `#efe6d4`

#### Scenario: Dark theme tokens activate via class

- **WHEN** the `<html>` element has class `dark`
- **THEN** `getComputedStyle(document.documentElement).getPropertyValue('--bg')` returns the dark variant `#1a1815`

### Requirement: Tailwind theme SHALL expose CSS Variables as colors

`tailwind.config.ts` SHALL define `theme.extend.colors` such that classes like `bg-bg`, `text-ink`, `border-line`, `bg-cool` resolve to the corresponding CSS Variables.

#### Scenario: Tailwind utility uses CSS Variable

- **WHEN** an element has class `bg-bg text-ink`
- **THEN** rendered background-color matches `var(--bg)` and color matches `var(--ink)`

### Requirement: Three font families SHALL be loaded with appropriate weights

The system SHALL load Shippori Mincho (400/600/800), Space Mono (400/700), and Caveat (400/600) from Google Fonts with `display: swap` and `preconnect`.

#### Scenario: Fonts are available

- **WHEN** an element has class `font-mincho`
- **THEN** rendered font-family is `Shippori Mincho, serif`

#### Scenario: Fonts use display swap

- **WHEN** fonts are still loading
- **THEN** fallback font is shown immediately (no invisible text)

### Requirement: Dark mode SHALL be toggleable via class strategy

`@nuxtjs/color-mode` SHALL be configured with `classSuffix: ''` so it sets `class="dark"` (not `class="dark-mode"`), aligned with Tailwind's `darkMode: 'class'`.

#### Scenario: Toggling color mode flips theme

- **WHEN** `useColorMode().preference` is set to `'dark'`
- **THEN** `<html>` gains class `dark` and CSS Variables resolve to dark values
