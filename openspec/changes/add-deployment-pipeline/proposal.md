## Why

MVP 上線需要 sitemap、OG image、Webmentions、Lighthouse 達標、Cloudflare Pages CI 設定。本 change 整合所有正式部署所需的最後一里設定。

## What Changes

- 安裝 `nuxt-simple-sitemap`，產出 `/sitemap.xml`
- 新增 `public/og-default.png`（1200×630 米色 + Mincho `Grayson's Portfolio.`）
- `app/app.vue` 設 default OG meta tags
- webmention.io 註冊取得 `webmention` 與 `pingback` endpoint URL
- `app/app.vue` 加 `<link rel="webmention">` 與 `<link rel="pingback">` meta
- Blog detail 底部加 webmentions section（fetch `https://webmention.io/api/mentions.jf2?target=...`）
- 連 Cloudflare Pages：
  - GitHub repo connect
  - Build command: `npx nuxt build && npx pagefind --site .output/public`
  - Build output: `.output/public`
  - Env vars: `NODE_VERSION=20`、全部 secrets（Resend / Turnstile / GitHub OAuth / SESSION_PASSWORD）
  - D1 binding 在 Settings → Functions
  - KV binding（rate limit 用）
- Push main 觸發部署
- 正式環境跑 migration：`npx wrangler d1 execute grayson-portfolio-db --remote --file=migrations/0001_init.sql`
- 跑 Lighthouse 確認 Performance / Accessibility / SEO ≥ 90

## Capabilities

### New Capabilities
- `deployment-pipeline`：正式部署所需的 sitemap、OG image、Webmentions、CF Pages CI 設定

### Modified Capabilities
- `blog-feature`：Blog detail 增加 webmentions section

## Impact

- 新增檔案：`public/og-default.png`
- 修改檔案：`app/app.vue`、`app/pages/blog/[slug].vue`、`nuxt.config.ts`、`package.json`
- 依賴：所有前面 14 個 changes
- 外部服務：Cloudflare Pages、webmention.io
- 驗證：線上 Lighthouse 三項 ≥ 90
