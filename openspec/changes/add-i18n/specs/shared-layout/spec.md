## MODIFIED Requirements

### Requirement: SiteHeader SHALL display navigation and theme toggle

`<SiteHeader>` SHALL render at 56px height containing: a `◇` mark + date label on the left, a 7-item navigation row in the center (`index`, `projects`, `journal`, `about`, `skills`, `journey`, `contact`), and a language switch pill + theme toggle pill + a search trigger on the right. The search trigger SHALL be a `rounded-md` button showing a magnifier icon on the left, a `search` text label in the middle, and OS-aware keyboard shortcut keys on the right — `⌘` + `K` (two separate `<kbd>` elements) on macOS, `Ctrl` + `K` on Windows/Linux. It has no hover effect.

#### Visual Detail: Search trigger button

| Property | Value |
|----------|-------|
| Height | `h-[30px]` |
| Padding | `px-[10px]` |
| Border | `border border-ink` |
| Border radius | `rounded-md` |
| Gap between elements | `gap-[6px]` |
| Icon | `<Search :size="13" />` (Lucide) |
| Label | `font-mono text-[13px]` — `"search"` |
| kbd gap | `gap-[2px]` between the two `<kbd>` elements |
| kbd border | `border border-ink/60` |
| kbd background | `bg-paper` |
| kbd border radius | `rounded` |
| kbd padding | `px-[5px] py-[2px]` |
| kbd font | `font-mono text-[11px]` |
| Hover | none |

Platform detection is deferred to `onMounted` (default `true` for SSR consistency) using `navigator.userAgent`.

#### Scenario: Active nav item is highlighted

- **WHEN** the current route is `/about` (or `/en/about`)
- **THEN** the `about` nav item has visible underline / opacity 1 while others have opacity 0.6

#### Scenario: Theme toggle flips dark mode

- **WHEN** the user clicks the theme toggle pill
- **THEN** `<html>` toggles class `dark` and CSS Variables flip values

#### Scenario: Search trigger opens SearchModal

- **WHEN** the user clicks the search trigger button
- **THEN** `<SearchModal>` opens (equivalent to pressing Cmd+K)

#### Scenario: Shortcut hint reflects the OS

- **WHEN** the header is rendered on a non-macOS client
- **THEN** the search trigger shows `Ctrl` + `K` as two separate `<kbd>` elements (macOS shows `⌘` + `K`)

## ADDED Requirements

### Requirement: SiteHeader language pill SHALL switch to the other locale

The language switch pill SHALL show the language it switches to — `EN` on zh-TW pages, `繁中` on English pages — and SHALL link to the current page in that locale. The header's navigation links SHALL point to the current locale's routes.

#### Scenario: Language pill switches the locale

- **WHEN** the user clicks the `EN` pill on `/about`
- **THEN** the browser navigates to `/en/about`, where the pill reads `繁中`

#### Scenario: Navigation stays in the current locale

- **WHEN** the header is rendered on `/en/about`
- **THEN** the `journal` nav item links to `/en/blog`

### Requirement: Mobile navigation SHALL offer the same language switch

The mobile navigation tools SHALL show the same language switch as the desktop header, with the same label and target.

#### Scenario: Switching from the mobile menu

- **WHEN** the user opens the mobile menu on `/journey` and taps `EN`
- **THEN** the browser navigates to `/en/journey`
