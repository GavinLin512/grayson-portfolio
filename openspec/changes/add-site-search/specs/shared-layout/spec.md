## MODIFIED Requirements

### Requirement: Default layout SHALL wrap pages with SiteHeader and SiteFooter

The system SHALL provide a `default` layout that renders `<SiteHeader>` at the top, `<slot />` in the middle, and `<SiteFooter>` at the bottom. A single `<SearchModal>` SHALL be mounted at the application root (`app.vue`), not inside any layout, so it is available on every page regardless of whether the page uses the `default` or `content` layout; it is triggered by Cmd+K.

#### Scenario: Page uses default layout

- **WHEN** a page does not specify a `layout` and is rendered
- **THEN** the rendered DOM contains `<SiteHeader>` before page content and `<SiteFooter>` after

#### Scenario: SearchModal opens via Cmd+K from any page

- **WHEN** the user presses Cmd+K (or Ctrl+K) on any page (using either the `default` or `content` layout)
- **THEN** `<SearchModal>` becomes visible regardless of which page is active

### Requirement: SiteHeader SHALL display navigation and theme toggle

`<SiteHeader>` SHALL render at 56px height containing: a `◇` mark + date label on the left, a 7-item navigation row in the center (`index`, `projects`, `journal`, `about`, `skills`, `journey`, `contact`), and an `EN` pill + theme toggle pill + a search trigger on the right. The search trigger SHALL be a `rounded-md` button showing a magnifier icon on the left, a `search` text label in the middle, and OS-aware keyboard shortcut keys on the right — `⌘` + `K` (two separate `<kbd>` elements) on macOS, `Ctrl` + `K` on Windows/Linux. The button has no hover fill effect.

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

- **WHEN** the current route is `/about`
- **THEN** the `about` nav item has visible underline / opacity 1 while others have opacity 0.6

#### Scenario: Theme toggle flips dark mode

- **WHEN** the user clicks the theme toggle pill
- **THEN** `<html>` toggles class `dark` and CSS Variables flip values

#### Scenario: Search trigger opens SearchModal

- **WHEN** the user clicks the search trigger pill
- **THEN** `<SearchModal>` opens (equivalent to pressing Cmd+K)

#### Scenario: Shortcut hint reflects the OS

- **WHEN** the header is rendered on a non-macOS client
- **THEN** the search trigger shows `Ctrl` + `K` as two separate `<kbd>` elements (macOS shows `⌘` + `K`)
