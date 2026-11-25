## MODIFIED Requirements

### Requirement: Three font families SHALL be loaded with appropriate weights

The system SHALL load Shippori Mincho (400/600/800), Space Mono (400/700), and Caveat (400/600) from Google Fonts with `display: swap` and `preconnect`, plus two Traditional Chinese fallbacks for the characters those families lack: Noto Serif TC (400/600) after Shippori Mincho and Noto Sans TC (400/700) after Space Mono. The fallbacks SHALL only be downloaded for the characters a page uses (Google Fonts unicode-range subsets).

#### Scenario: Fonts are available

- **WHEN** an element has class `font-mincho`
- **THEN** rendered font-family is `Shippori Mincho, Noto Serif TC, serif`

#### Scenario: Chinese text has a matching font

- **WHEN** a zh-TW heading in `font-mincho` contains a character Shippori Mincho does not have
- **THEN** that character renders in Noto Serif TC, not in the browser's default font

#### Scenario: Fonts use display swap

- **WHEN** fonts are still loading
- **THEN** fallback font is shown immediately (no invisible text)
