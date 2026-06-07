# d1-database Specification

## Purpose
Defines the Cloudflare D1 (edge SQLite) setup: the `wrangler.toml` database binding, the guestbook table migration, and the `useDb` server utility that exposes prepared-statement helpers to server routes.

## Requirements

### Requirement: Cloudflare D1 database SHALL be configured via wrangler.toml

The repository SHALL contain a `wrangler.toml` file declaring a D1 database binding with `binding = "DB"` and a valid `database_id`.

#### Scenario: Wrangler reads the configuration

- **WHEN** a developer runs `npx wrangler d1 list`
- **THEN** the database name in `wrangler.toml` appears in the list

### Requirement: Migration SHALL create the guestbook table

`migrations/0001_init.sql` SHALL create a `guestbook` table with columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `github_id TEXT NOT NULL`, `name TEXT NOT NULL`, `avatar TEXT`, `message TEXT NOT NULL`, `created_at INTEGER NOT NULL`, `ip_hash TEXT`.

#### Scenario: Local migration creates the table

- **WHEN** a developer runs `npx wrangler d1 execute <db> --local --file=migrations/0001_init.sql`
- **THEN** `SELECT name FROM sqlite_master WHERE type='table'` returns a row containing `guestbook`

#### Scenario: Schema matches specification

- **WHEN** the table is created
- **THEN** `PRAGMA table_info(guestbook)` returns 7 columns with the names and types listed above

### Requirement: D1 utility SHALL be available to server routes

`server/utils/db.ts` SHALL export functions that take a Nitro event and return prepared statement helpers bound to the D1 binding from `event.context.cloudflare.env.DB`.

#### Scenario: Utility resolves D1 binding from event

- **WHEN** a server route calls `useDb(event)`
- **THEN** the returned object exposes methods like `getMessages()`, `insertMessage(...)` that compile to D1 prepared statements
