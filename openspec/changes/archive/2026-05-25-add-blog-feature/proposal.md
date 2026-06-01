## Why

技術 Blog 是 portfolio 的內容核心，需含列表、文章詳情、Mermaid 圖、RSS feed。透過 `@nuxt/content` 管理 Markdown 內容，作者體驗統一，diff 友好。

## What Changes

- 安裝 `@nuxt/content` module
- 建立 `content/blog/` 目錄，寫 2 篇 sample.md（frontmatter: title/date/readTime/tags/pinned）
- 新增 `app/pages/blog/index.vue`：BlogList 版型（`grid-cols-[1.4fr_1fr]` 左主欄 + 右側 pinned/archive，chip filter）
- 新增 `app/pages/blog/[slug].vue`：BlogDetail 版型（`grid-cols-[180px_1fr_180px]` TOC/article/also reading，lede 用 Mincho）
- 安裝 `mermaid` 並覆寫 ContentRenderer 的 `<pre code class="language-mermaid">` 為 mermaid 渲染
- 新增 `app/composables/useReadingTime.ts`（字數除以 200）
- 新增 `server/routes/rss.xml.ts`：產出 RSS 2.0 feed
- Blog detail 加一條對角 φ 線（opacity 0.45）

## Capabilities

### New Capabilities
- `blog-feature`：Markdown blog 系統，含列表、詳情、Mermaid 渲染、RSS feed

### Modified Capabilities
（無）

## Impact

- 新增檔案：`app/pages/blog/index.vue`、`app/pages/blog/[slug].vue`、`app/composables/useReadingTime.ts`、`server/routes/rss.xml.ts`、`content/blog/*.md`
- 修改檔案：`nuxt.config.ts`（加 `@nuxt/content` module）
- 依賴：`add-shared-layout`
- 路由：`/blog`、`/blog/[slug]` SSG prerender；`/rss.xml` server route
