## Context

Greenfield Nuxt 4 portfolio project. Target deployment is Cloudflare Pages with Workers (Nitro `cloudflare-pages` preset). All subsequent changes depend on this foundation.

## Goals / Non-Goals

**Goals:**
- Provide a runnable Nuxt 4 dev environment
- Lock down git hygiene before any secrets exist
- Pin deployment target to Cloudflare Pages from day one

**Non-Goals:**
- Installing UI / styling modules (deferred to `add-design-tokens`)
- Setting up content management (deferred to `add-blog-feature`)
- Any application features

## Decisions

- **Nuxt 4 `app/` directory convention**: Nuxt 4 uses `app/` as the default application directory. No `future.compatibilityVersion` flag is required. Rationale: Nuxt 4 is now stable (4.4.6); starting directly on Nuxt 4 avoids a future migration.
- **`pnpm` as package manager**: Lock file is `pnpm-lock.yaml`. Rationale: faster than npm, better monorepo support if ever needed, smaller `node_modules`.
- **Cloudflare Pages build outputs to `dist/`**: The `nitro.preset = 'cloudflare-pages'` preset outputs to `dist/` (not `.output/`), which matches Cloudflare Pages' expected layout (`_worker.js`, `_routes.json`, `_nuxt/`).
- **`.env.example` is tracked, `.env*` are not**: Keeps env schema discoverable while preventing secrets from leaking. Test keys for Turnstile etc. live in `.env.example` (they're public dummy keys).

## Risks / Trade-offs

- **Risk**: Nuxt 4 is a major version; some community modules may not yet support it → Mitigation: evaluate module compatibility before adding in subsequent changes
- **Risk**: Developers might commit `.env` if they bypass `.gitignore` → Mitigation: educate via README; consider pre-commit hook in a later change
