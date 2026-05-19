## ADDED Requirements

### Requirement: Nuxt 4 dev server SHALL start without errors

The repository SHALL contain a valid Nuxt 4 project scaffold such that running `pnpm dev` starts a development server reachable at `http://localhost:3000` without compilation or runtime errors.

#### Scenario: Fresh clone bootstraps successfully

- **WHEN** a developer clones the repo, runs `pnpm install`, then runs `pnpm dev`
- **THEN** the dev server boots within 30 seconds and serves a "hello world" page at `http://localhost:3000`

#### Scenario: app directory convention is active

- **WHEN** the project structure is inspected
- **THEN** application code lives under `app/` (Nuxt 4 default; no `future.compatibilityVersion` flag required)

### Requirement: Cloudflare Pages preset SHALL be configured

`nuxt.config.ts` SHALL set `nitro.preset = 'cloudflare-pages'` so that production builds output Cloudflare-Pages-compatible artifacts.

#### Scenario: Production build targets Cloudflare Pages

- **WHEN** `pnpm build` is executed
- **THEN** the `dist/` directory contains Cloudflare Pages assets (`_worker.js`, `_routes.json`, `_headers`, `_redirects`, `_nuxt/`)

### Requirement: Git SHALL ignore secrets and build artifacts

The `.gitignore` file SHALL exclude `.env`, `.env.*` (except `.env.example`), `node_modules/`, `.nuxt/`, `.output/`, `dist/`, `.wrangler/`, and `.DS_Store`.

#### Scenario: Secrets cannot be accidentally committed

- **WHEN** a developer creates a `.env` file with credentials and runs `git status`
- **THEN** `.env` does not appear in the list of changes tracked by git

#### Scenario: Env schema is shared

- **WHEN** the repo is fresh-cloned
- **THEN** `.env.example` exists and is tracked by git, documenting expected environment variable keys
