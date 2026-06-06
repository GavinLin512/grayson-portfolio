## 1. Wrangler Setup

- [x] 1.1 Run `pnpm add -D wrangler`
- [x] 1.2 Run `npx wrangler login` (one-time auth)

## 2. Create D1 Database

- [x] 2.1 Run `npx wrangler d1 create grayson-portfolio-db`
- [x] 2.2 Note the returned `database_id` value

## 3. wrangler.toml

- [x] 3.1 Create `wrangler.toml`:
  ```toml
  name = "grayson-portfolio"
  compatibility_date = "2026-05-01"
  pages_build_output_dir = ".output/public"

  [[d1_databases]]
  binding = "DB"
  database_name = "grayson-portfolio-db"
  database_id = "<paste from step 2.2>"
  ```

## 4. Migration SQL

- [x] 4.1 Create `migrations/0001_init.sql`:
  ```sql
  CREATE TABLE IF NOT EXISTS guestbook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    ip_hash TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook(created_at DESC);
  ```

## 5. Run Local Migration

- [x] 5.1 Run `npx wrangler d1 execute grayson-portfolio-db --local --file=migrations/0001_init.sql`
- [x] 5.2 Verify: `npx wrangler d1 execute grayson-portfolio-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"` should list `guestbook`

## 6. D1 Utility

- [x] 6.1 Create `server/utils/db.ts`
- [x] 6.2 Export `useDb(event: H3Event)` that reads `event.context.cloudflare.env.DB` and returns helpers:
  - `getMessages(limit = 50)`: `SELECT * FROM guestbook ORDER BY created_at DESC LIMIT ?`
  - `insertMessage(...)`: `INSERT INTO guestbook (...) VALUES (...)` using prepared statements
- [x] 6.3 Throw clear error if DB binding is missing (helps catch missing Cloudflare context in dev)

## 7. Verification

- [x] 7.1 Write a temporary `server/api/test-d1.get.ts` that calls `useDb(event).getMessages()` and returns the result
- [x] 7.2 Run `npx wrangler pages dev .output/public --d1 DB=grayson-portfolio-db` and hit `http://localhost:8788/api/test-d1`
- [x] 7.3 Should return `[]` (empty array, no rows yet) without errors
- [x] 7.4 Delete the temporary test route
