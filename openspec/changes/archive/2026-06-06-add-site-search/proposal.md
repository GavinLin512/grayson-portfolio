## Why

全站搜尋讓訪客快速找到 blog + projects 內容，Cmd+K 是現代網站慣例。Pagefind 對靜態網站友善、不需後端、build 時建索引，與 SSG 完全相容。本地 dev 無索引時必須靜默 fallback，不能噴錯。

## What Changes

- 安裝 `pagefind` dev dependency
- `package.json` scripts 加 `"build:search": "pagefind --site dist"` 與 `"build": "nuxt build && pnpm build:search"`
- 新增 `app/composables/usePagefind.ts`：try/catch 動態載入 `/pagefind/pagefind.js`，失敗時回傳 null
- 新增 `app/components/SearchModal.vue`：
  - props: `open: boolean`
  - 米色 modal + 1px ink border、input `bg-paper border-ink h-[38px]`
  - 結果列表沿用 BlogList 樣式
  - 全域 keydown listener：Cmd/Ctrl+K toggle
- 修改 `app/layouts/default.vue` 掛 SearchModal
- 修改 SiteHeader 加 search icon 按鈕

## Capabilities

### New Capabilities
- `site-search`：Pagefind 全站搜尋系統，Cmd+K 開啟 modal

### Modified Capabilities
- `shared-layout`：default layout 增加 SearchModal 掛載；SiteHeader 增加 search icon

## Impact

- 新增檔案：`app/composables/usePagefind.ts`、`app/components/SearchModal.vue`
- 修改檔案：`app/layouts/default.vue`、`app/components/SiteHeader.vue`、`package.json`、`nuxt.config.ts`（加 `nitro.prerender.crawlLinks: true` 讓詳細頁 prerender；加 `nitro.cloudflare.pages.routes.exclude: ['/pagefind/*']` 讓 `/pagefind/*` 走靜態檔不進 worker）
- 依賴：`add-blog-feature` + `add-projects-feature`（需要內容才能索引）
- Cloudflare Pages build command 設為 `pnpm build`（已同時跑 `nuxt build` 與 `pagefind --site dist`，無需另設 pagefind 步驟）
