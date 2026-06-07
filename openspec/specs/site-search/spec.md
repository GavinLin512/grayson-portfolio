# site-search Specification

## Purpose
Defines Pagefind-powered static search — a Cmd+K SearchModal querying the build-time index, graceful local-dev fallback when no index exists, and the build command that produces the index.

## Requirements

### Requirement: Cmd+K keyboard shortcut SHALL toggle SearchModal

The system SHALL listen for `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux) keyboard events globally. Pressing the shortcut SHALL toggle the `SearchModal` open / closed state.

#### Scenario: Open modal with Cmd+K

- **WHEN** the user presses Cmd+K (or Ctrl+K) on any page
- **THEN** `SearchModal` becomes visible with the input focused

#### Scenario: Close modal with Escape

- **WHEN** the modal is open and the user presses Escape
- **THEN** the modal closes and focus returns to the previously focused element

### Requirement: SearchModal SHALL query Pagefind index

The modal SHALL load `/pagefind/pagefind.js` and call its search API to query for matches against the user's input.

#### Scenario: Typing shows live results

- **WHEN** the user types "grid" into the search input
- **THEN** the result list shows posts and projects containing "grid", with title and excerpt

#### Scenario: Result click navigates to page

- **WHEN** the user clicks a result entry
- **THEN** the browser navigates to that result's URL and the modal closes

### Requirement: Local dev environment SHALL fail gracefully without an index

When the Pagefind index is missing (e.g. in `pnpm dev` mode), the modal SHALL display a message explaining the index is unavailable, and SHALL NOT throw a runtime error or block keyboard interaction.

#### Scenario: Dev mode shows informative message

- **WHEN** the user opens SearchModal in `pnpm dev` mode
- **THEN** the modal shows "Search index not built. Run `pnpm build` to enable search." instead of an error

### Requirement: Build command SHALL produce Pagefind index

The `pnpm build` script SHALL run `nuxt build` followed by `pagefind --site dist` so the deployment includes a working index.

#### Scenario: Build script runs both steps

- **WHEN** `pnpm build` is executed
- **THEN** `dist/pagefind/` directory exists with index files (`pagefind.js`, `pagefind-ui.js`, language indexes)
