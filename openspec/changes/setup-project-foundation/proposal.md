## Why

Portfolio 專案目錄目前為空，需要建立 Nuxt 4 骨架與 git 安全性基線，作為所有後續 change 的基礎。沒有可啟動的開發環境前，任何頁面或元件都無法開發。

## What Changes

- 用 `nuxi init` 建立 Nuxt 4 專案結構（`nuxt@^4.4.6`）
- Nuxt 4 預設使用 `app/` 目錄，無需 `future.compatibilityVersion` flag
- `.gitignore` 排除所有機密與建置產物（`.env`、`.nuxt/`、`.output/`、`dist/`、`.wrangler/`、`node_modules/` 等）
- 建立 `.env.example` 作為環境變數 schema 範本
- `nuxt.config.ts` 設定 `nitro.preset = 'cloudflare-pages'`（build 輸出至 `dist/`）
- 寫一個最小 `app/app.vue` 確認 dev server 可啟動

## Capabilities

### New Capabilities
- `project-foundation`：提供可啟動的 Nuxt 4 開發環境與 git 安全性基線

### Modified Capabilities
（無）

## Impact

- 新增檔案：`package.json`、`nuxt.config.ts`、`tsconfig.json`、`app/app.vue`、`.gitignore`、`.env.example`
- 部署目標：Cloudflare Pages（透過 `nitro.preset`，輸出至 `dist/`）
- 後續所有 change 都依賴本 change 完成
