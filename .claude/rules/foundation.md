# Project Foundation

## 技術棧

- **Framework**: Nuxt 4.4.6
- **Package manager**: pnpm
- **部署目標**: Cloudflare Pages（Nitro `cloudflare-pages` preset）

## 目錄結構慣例

Nuxt 4 預設使用 `app/` 目錄存放應用程式碼（components、pages、layouts 等），無需 `future.compatibilityVersion` flag。

## Build 產出：`dist/`

執行 `pnpm build` 時，Nuxt 透過 Nitro（`cloudflare-pages` preset）將整個專案編譯至 `dist/`：

| 路徑 | 說明 |
|------|------|
| `dist/_nuxt/` | Vite 編譯的前端靜態資源（JS、CSS） |
| `dist/_worker.js/` | Nitro 打包的 SSR server，作為 Cloudflare Workers 執行入口 |
| `dist/_routes.json` | 哪些路徑走 Worker，哪些走靜態檔案 |
| `dist/_headers` | HTTP 回應 header 規則 |
| `dist/_redirects` | 重新導向規則 |
| `dist/nitro.json` | Nitro build metadata |

`dist/` 已列入 `.gitignore`，不進版本控制。每次 deploy 前執行 `pnpm build` 重新產生。

## Git Hygiene

`.gitignore` 排除以下項目：

- `.nuxt/` — Nuxt dev/build 暫存
- `.output/` — Nitro 預設輸出（本專案不使用，但仍排除）
- `dist/` — Cloudflare Pages build 輸出
- `.wrangler/` — Wrangler CLI 暫存
- `worker-configuration.d.ts` — `wrangler types` 產生的型別宣告（postinstall 自動重生）
- `node_modules/`
- `.env`, `.env.*`（`.env.example` 除外）
- `.DS_Store`

`.env.example` 追蹤進 git，作為環境變數 schema 的範本參考。

## 型別產生：`worker-configuration.d.ts`

由 `wrangler types` 產生，宣告 Cloudflare runtime 型別與 binding（`DB`、`RATE_LIMIT`）+ env 變數**名稱**。此檔是 `wrangler.toml` 的**衍生產物**，比照 `.nuxt/` 處理：**gitignored、不進版控**，靠 `package.json` 的 `postinstall`（`nuxt prepare && wrangler types`）在每次 install 自動重生。

- **部署不需要**：Cloudflare runtime 從 `wrangler.toml` / Dashboard 讀 binding，不看此檔；`pnpm build`（`nuxt build`）預設也不做 typecheck。
- **僅供開發期型別**：`nuxt typecheck` 與編輯器 IntelliSense 需要它（例如 `server/utils/db.ts` 的 `D1Database` 型別）。
- **不會 stale**：因每次 `pnpm install` 由 postinstall 從最新 `wrangler.toml` 重生。手動需要時可隨時跑 `npx wrangler types`。
