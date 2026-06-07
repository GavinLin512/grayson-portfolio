## Why

Guestbook 需要持久化儲存留言，D1（SQLite at edge）為下一個 change 提供基礎。先建立 wrangler.toml 設定、migration schema、D1 client utility，獨立於 guestbook 業務邏輯。

## What Changes

- 安裝 `wrangler` dev dependency
- 新增 `wrangler.toml`：`name`、`compatibility_date`、`[[d1_databases]]` binding name = `DB`
- 建立 D1 database：`npx wrangler d1 create grayson-portfolio-db`，取得 `database_id` 填入 toml
- 新增 `migrations/0001_init.sql`：guestbook table schema
  - `id INTEGER PRIMARY KEY AUTOINCREMENT`
  - `github_id TEXT NOT NULL`
  - `name TEXT NOT NULL`
  - `avatar TEXT`
  - `message TEXT NOT NULL`
  - `created_at INTEGER NOT NULL`
  - `ip_hash TEXT`
- 本地執行：`npx wrangler d1 execute grayson-portfolio-db --local --file=migrations/0001_init.sql`
- 新增 `server/utils/db.ts`：從 `event.context.cloudflare.env.DB` 取 binding，匯出 prepared statement helpers

## Capabilities

### New Capabilities
- `d1-database`：Cloudflare D1 資料庫設定、guestbook table schema、D1 client utility

### Modified Capabilities
（無）

## Impact

- 新增檔案：`wrangler.toml`、`migrations/0001_init.sql`、`server/utils/db.ts`
- 依賴：`add-shared-layout`
- 後續 `add-guestbook-feature` 將使用此基礎
- 本地測試需用 `wrangler pages dev`（與 `nuxt dev` 並存）
