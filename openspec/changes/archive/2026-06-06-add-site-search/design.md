## Context

A site-wide search is expected on developer portfolios. Pagefind builds a static index after `nuxt build` and runs entirely client-side — no backend. The index must be missing in dev mode without breaking the page.

## Goals / Non-Goals

**Goals:**
- Cmd+K opens a fast, responsive search
- Search covers blog + projects content
- Zero search backend (pure static)
- Dev mode does not error when index is absent

**Non-Goals:**
- Search filters / facets (just plain text matching)
- Search analytics (not needed for portfolio)
- Algolia / Meilisearch integration (Pagefind is sufficient)

## Decisions

- **Pagefind over Algolia/Meilisearch**: No API key, no backend, no monthly fee, no privacy concerns. Index is bundled with the site assets. Trade-off: no analytics; acceptable for portfolio.
- **Build command coupling**: `package.json` `"build"` script does both `nuxt build` and `pagefind`. Cloudflare Pages dashboard `Build command` is therefore just `pnpm build`. Rationale: keeps deployment configuration simple.
- **Dynamic import in `usePagefind` composable**: `await import('/pagefind/pagefind.js')` — wrapped in try/catch so dev mode (where the file doesn't exist) returns `null` instead of throwing. UI checks for `null` and shows a message.
- **Modal uses native `<dialog>` element**: Built-in focus trap, Escape handling, accessibility. Styled with Tailwind to match design.

## Risks / Trade-offs

- **Risk**: Pagefind requires content to be in the HTML (not lazy-loaded). Mermaid diagrams render client-side so they aren't indexed. Mitigation: indexing post titles + body text is sufficient; diagram content is supplementary
- **Risk**: Cmd+K conflicts with browser address bar focus on some platforms. Mitigation: also bind Ctrl+K (which doesn't conflict on macOS), and add a visible "Search" button in `SiteHeader`
