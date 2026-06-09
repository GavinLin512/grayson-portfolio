## Why

部落格文章底部需要逐篇留言討論。`add-guestbook-feature` 已建好 D1 + GitHub OAuth + IP hash 的基礎設施；
重用這套自建架構即可做到「全站視覺一致、零第三方 iframe（不引 giscus）」的文章留言，
只需把留言關聯到 `post_slug`，並抽出共用元件供 guestbook 與 blog 共用。

## What Changes

- 新增 D1 migration `0002_comments.sql`：`comments` 表（含 `post_slug` 欄位 + 索引）
- 擴充 `server/utils/db.ts`：`getComments(slug, limit)`、`insertComment(...)`
- 新增 `server/api/comments.get.ts`：依 `?slug=` 列出該文最近 N 筆
- 新增 `server/api/comments.post.ts`：驗 session → 驗 slug+message → hash IP → 寫入 D1
- 抽出共用元件 `app/components/Comments.vue`（`slug?` prop）：
  - 無 `slug` → guestbook 模式（打 `/api/guestbook`）
  - 有 `slug` → blog 模式（打 `/api/comments?slug=`）
- 重構 `app/pages/guestbook.vue` 改用 `<Comments />`（單一真實來源）
- `app/pages/blog/[slug].vue` 文章底部加 `<Comments :slug="slug" />`
- 留言區為 **CSR island**：文章本體維持 prerender（Pagefind/SEO 不變），留言 client 端載入

## Capabilities

### New Capabilities
- `blog-comments`：逐篇文章留言，GitHub OAuth 登入 + D1 儲存，重用 guestbook 基礎設施

### Modified Capabilities
- `guestbook-feature`：UI 抽成共用 `<Comments>` 元件（行為不變，僅重構）

## Impact

- 新增檔案：`migrations/0002_comments.sql`、`server/api/comments.get.ts`、`server/api/comments.post.ts`、`app/components/Comments.vue`、`server/utils/hash.ts`（`hashIP` 抽出）、`server/routes/auth/login.get.ts`（登入後導回原頁）
- 修改檔案：`server/utils/db.ts`、`server/utils/ratelimit.ts`（改 import `hashIP`）、`server/api/guestbook.post.ts`（改 import `hashIP`）、`server/routes/auth/github.get.ts`（onSuccess 讀 redirect cookie）、`app/pages/guestbook.vue`、`app/pages/blog/[slug].vue`
- 依賴：`add-guestbook-feature`（D1、OAuth、hashIP、session）
- 外部服務：無新增（沿用既有 GitHub OAuth App）
