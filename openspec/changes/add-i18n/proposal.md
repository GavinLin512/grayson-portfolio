## Why

journal 已經改成中文先寫、再翻成英文（`content/blog` 中文、`content/i18n/en/blog` 英文），但網站只有一種語言：英文版文章沒有地方顯示，中文讀者看到的介面也全是英文。header 的 `EN` 也只是預留位置。現在加入中英文切換，讓同一個網站分別服務中文和英文讀者。

## What Changes

- 安裝 `@nuxtjs/i18n`，語系 `zh-TW`（預設，`/`）與 `en`（`/en/...`），策略 `prefix_except_default`
- 只在首頁 `/` 依瀏覽器語言偵測一次並記在 cookie；其他網址一律照網址的語言顯示，分享出去的連結不會被導走。首頁改為 SSR，由伺服器判斷後導向，英文讀者不會先看到中文首頁
- 新增翻譯檔 `i18n/locales/zh-TW.json`、`en.json`，介面字串搬進翻譯檔
- 品牌名稱（`Grayson's Portfolio.`、`grayson`、`EN`…）與小寫英文的設計標籤（導覽列 `index`、`journal`，區塊標籤 `— 06 / about`）兩種語言都維持英文；句子與功能文字（首頁的自我介紹、`close`、`menu`、`search`、表單欄位）翻譯
- header 的 `EN` 改成真的語言切換（中文頁顯示 `EN`、英文頁顯示 `繁中`），切換後留在同一頁的另一個語言版本
- journal 接上兩種語言的文章：中文 `content/blog`、英文 `content/i18n/en/blog`，各自一個 Nuxt Content collection
- `<html lang>` 依語系設定（`zh-TW` / `en`），加上 hreflang 與 canonical
- 中文字型 fallback：Shippori Mincho 缺字的部分改用 Noto Serif TC，Space Mono 缺字的部分用 Noto Sans TC
- `Comments.vue` 的日期依目前語系格式化（現在寫死 `en-US`）
- sitemap 列出兩種語言的網址；RSS 依語系各一份（`/rss.xml` 中文、`/en/rss.xml` 英文）
- Pagefind 依 `<html lang>` 分語言建索引，搜尋只找目前語言的頁面
- Argos 補上 `/en` 的截圖
- projects、skills、journey timeline 的內容這次**不翻譯**，兩種語言都顯示英文內容（介面字串仍會翻譯）

**BREAKING**（網址的內容改變）：`/`、`/blog/...` 等現有網址改為顯示中文版，英文版移到 `/en/...`。

## Capabilities

### New Capabilities

- `i18n`：語系路由、首頁的瀏覽器語言偵測、語言切換、翻譯檔、`<html lang>` / hreflang / canonical，以及哪些字串翻譯、哪些維持英文的規則

### Modified Capabilities

- `shared-layout`：header 的 `EN` 從裝飾改成語言切換；手機版選單同步
- `blog-feature`：列表與文章頁依語系查對應的 collection；英文版在 `/en/blog/...`；RSS 依語系各一份
- `site-search`：索引依語言分開，搜尋結果只包含目前語言的頁面；切換語言後改用另一個語言的索引
- `design-tokens`：字型堆疊加入中文 fallback（Noto Serif TC、Noto Sans TC）
- `blog-comments`：留言日期依目前語系格式化

## Impact

- **新依賴**：`@nuxtjs/i18n`（10.x，支援 Nuxt 4）
- **新檔案**：`i18n/locales/zh-TW.json`、`i18n/locales/en.json`、語言切換元件
- **修改**：`nuxt.config.ts`（i18n 設定、googleFonts、prerender 路由；`/` 從 prerender 改為 SSR）、`content.config.ts`（英文 blog collection）、`tailwind.config.ts`（字型堆疊）、`app/app.vue`（head）、`SiteHeader.vue`、`mobile-nav/Tools.vue`、各頁面的介面字串、`pages/blog/*`、`Comments.vue`、`usePagefind.ts`、`server/api/__sitemap__/urls.ts`、`server/routes/rss.xml.ts`、`tests/screenshot-pages.spec.ts`
- **前置條件**：文章分支 `claude/current-project-check-3ixyjg`（中文文章與英文版）要先合併進 `dev`，否則沒有兩種語言的文章可以接
- **SEO**：既有網址改為中文內容；用 hreflang 與 canonical 告訴搜尋引擎兩個版本的對應
- **Argos**：所有既有頁面的截圖會變成中文介面，需要重新核准一次；`/en` 頁面是新的截圖
- **檢查**：`.l10nrc.yml` 的 l10n-review 在每個 PR 檢查還沒搬進翻譯檔的字串、翻譯檔的 key 與變數，以及 vue-i18n 無法編譯的訊息（例如 email 的 `@`）
