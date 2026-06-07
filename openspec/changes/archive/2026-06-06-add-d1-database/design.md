## Context

Guestbook needs persistent storage. Cloudflare D1 (SQLite at edge) is free up to 5GB / 5M reads / 100K writes per day — far beyond a personal portfolio's needs. The D1 setup is decoupled from guestbook business logic so future features can also use the same DB.

## Goals / Non-Goals

**Goals:**
- D1 database created and bound to the project
- Initial migration creates guestbook schema
- Reusable D1 client helper for server routes
- Local dev works against a local D1 (no remote DB calls)

**Non-Goals:**
- ORM (Drizzle / Kysely) — overkill for one table
- Migration runner / version table — manual `wrangler d1 execute` is fine for now
- Connection pooling / retries — D1 handles these internally

## Decisions

- **One binding name: `DB`**: Used consistently in wrangler.toml and server code (`env.DB`).
- **Prepared statements via D1's native API**: `db.prepare('SELECT ...').bind(...).all()`. No abstraction layer. Rationale: D1's API is already minimal; an ORM would add complexity for one table.
- **`ip_hash` instead of raw IP**: Hash with a per-environment salt before storing. GDPR-friendly, no PII issues.
- **`created_at` as Unix epoch INTEGER**: Avoids SQLite's date-string quirks; easy to format on read.

## Risks / Trade-offs

- **Risk**: Schema changes require manual migration tracking. Mitigation: keep migrations numerically prefixed (`0001_`, `0002_`...) and only run them once; document state in README
- **Trade-off**: D1 in dev requires `wrangler pages dev` (not plain `nuxt dev`). Accepted: two startup commands (`pnpm dev` for frontend, `wrangler pages dev` for D1-dependent features)
