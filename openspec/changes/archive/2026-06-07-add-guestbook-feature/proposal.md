## Why

訪客留言板需要 GitHub OAuth 防匿名洗版。整合 D1 儲存、`nuxt-auth-utils` 身份驗證、留言列表與表單頁。

## What Changes

- 安裝 `nuxt-auth-utils` module
- 建立 GitHub OAuth App：
  - 本地：callback `http://localhost:3000/auth/github`
  - 正式：CF Pages 部署後再建一個 OAuth App
- `.env` 加 `NUXT_OAUTH_GITHUB_CLIENT_ID`、`NUXT_OAUTH_GITHUB_CLIENT_SECRET`、`NUXT_SESSION_PASSWORD`（32+ 字元隨機）
- 新增 `server/routes/auth/github.get.ts`：使用 `defineOAuthGitHubEventHandler`
- 新增 `server/api/guestbook.get.ts`：從 D1 列出最近 50 筆
- 新增 `server/api/guestbook.post.ts`：驗 session → hash IP → 寫入 D1
- 新增 `app/pages/guestbook.vue`：
  - 未登入：「Sign in with GitHub」按鈕
  - 已登入：avatar + name + textarea + submit
  - 下方列表：每筆 GitHub avatar circle + name(label) + date(label) + message(note)
- `routeRules: { '/guestbook': { swr: 60 } }`

## Capabilities

### New Capabilities
- `guestbook-feature`：訪客留言板，GitHub OAuth 登入 + D1 儲存 + SWR 60 秒

### Modified Capabilities
- `shared-layout`：`SiteFooter` 右側的 `scroll ↓` 改為 `guestbook →` 連結，作為 guestbook 導覽入口

## Impact

- 新增檔案：`app/pages/guestbook.vue`、`server/api/guestbook.get.ts`、`server/api/guestbook.post.ts`、`server/routes/auth/github.get.ts`
- 修改檔案：`nuxt.config.ts`（加 `nuxt-auth-utils`）、`.env.example`、`app/components/SiteFooter.vue`（加 guestbook 連結）
- 依賴：`add-d1-database`
- 外部服務：GitHub OAuth（免費無限）
