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
- `node_modules/`
- `.env`, `.env.*`（`.env.example` 除外）
- `.DS_Store`

`.env.example` 追蹤進 git，作為環境變數 schema 的範本參考。
