## Context

部落格文章需要留言功能。`add-guestbook-feature` 已驗證可用：D1 儲存、`nuxt-auth-utils` 的 GitHub OAuth、
`server/utils/ratelimit.ts` 的 `hashIP`。本 change 重用這套，避免引入 giscus 等第三方 iframe
（會破壞站點自訂的 beige 設計系統）。核心新增是把留言關聯到文章 `post_slug`，並把 UI 抽成共用元件。

## Goals / Non-Goals

**Goals:**
- 每篇 blog 文章底部可逐篇留言（GitHub 登入才可發、任何人可讀）
- guestbook 與 blog 共用同一個 `<Comments>` 元件與視覺
- 文章本體維持 prerender，不因留言而改變 SEO / Pagefind 行為

**Non-Goals:**
- 巢狀回覆 / threading（沿用扁平列表，與 guestbook 一致）
- 留言編輯 / 刪除 UI（沿用「手動 SQL 刪除」的安全網）
- Reactions / Markdown
- 留言內容被 Pagefind 索引（刻意不索引）

## Decisions

- **新建 `comments` 表，不共用 `guestbook` 表**：guestbook 是站點層級（無 slug），blog 留言是逐篇（有 slug）。
  另立 `comments` 表語意清晰、guestbook 維持穩定不動 schema。代價是 schema 有部分重複，可接受。
  - 替代方案（已否決）：在 `guestbook` 加 nullable `post_slug`，NULL=guestbook。語意混淆，否決。
- **共用 `<Comments>` 元件，`slug?` prop 切換模式**：
  - listUrl = `slug ? '/api/comments?slug=' + slug : '/api/guestbook'`
  - postUrl = `slug ? '/api/comments' : '/api/guestbook'`，body 在 blog 模式帶 `slug`
  - 單一真實來源，guestbook 重構後吃同一份樣式與邏輯。
- **留言為 CSR island**：blog 文章維持 `prerender: true`（Pagefind 需要靜態 HTML）。
  `<Comments>` 以 client 端 fetch（`server: false`）或 `<ClientOnly>` 載入，
  使 prerender 的 HTML 不含留言資料 → 不會踩到 guestbook 那次「prerender 快照成空留言」的坑，
  也讓留言不進 Pagefind 索引（符合 Non-Goal）。
- **登入 UI 必須 `<ClientOnly>`**：session 是 cookie-based、只有 client 端知道；
  prerender 的靜態頁不能把登入態寫死進 HTML（與 guestbook 同樣處理）。
- **沿用 `hashIP` + `getUserSession`**：POST 驗 session（401）、zod 驗 `slug`+`message`（400）、hash IP 後寫入。
- **`hashIP` 抽到 `server/utils/hash.ts`**：原本住在 `ratelimit.ts`（私有 helper），現在 guestbook + comments 都要用，
  名稱已不只服務 rate limit。趁第三個 consumer（comments）加入時抽成獨立 `hash.ts`，`ratelimit.ts` 與
  `guestbook.post.ts` 改 import。Nitro auto-import 讓呼叫端不需手動 import；guestbook 的 `ip_hash` 寫入行為不變。

## Risks / Trade-offs

- **Risk**: 重構 guestbook 改用共用元件可能回歸既有行為 → Mitigation: 保持 API 合約不變，
  靠 Argos 視覺測試 + 手動驗證 guestbook 仍正常。
- **Risk**: 留言不在 prerender HTML 內 → 不被 Pagefind 索引 → 這是**刻意**的（Non-Goal），非缺陷。
- **Trade-off**: 無 rate limit，理論上登入者可洗版 → 沿用 guestbook 的取捨（信任登入者）；
  若出現濫用，未來用 `checkRateLimit` 對 `comment` 加 per-IP 限制（deferred v2）。
- **Trade-off**: 無回覆功能，討論是扁平的 → 與 guestbook 一致，維持簡單。
