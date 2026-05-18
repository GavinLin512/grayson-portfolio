# Portfolio 個人網站 — 功能規劃與實作計畫

## Context

使用者是偏向後端的全端工程師，要從零開始建立 portfolio 個人網站，展示專案作品集、個人資訊、學歷。
透過討論已選定要納入的功能與技術選型；本計畫只規劃實作方向，**尚不開始實作**。
專案目錄 `/Users/linjiamin/Documents/GitHub/grayson-portfolio/` 目前為空（greenfield project）。

---

## 技術選型總結

| 類別 | 選擇 |
|---|---|
| 前端框架 | Nuxt 3 (Vue 3, Composition API, TypeScript) |
| 部署 | Cloudflare Pages + Workers（Nitro `cloudflare-pages` preset）|
| Blog 內容 | 本地 MDX 檔案（`@nuxt/content` v3）|
| 資料庫 | Cloudflare D1（SQLite at edge）|
| Email 寄送 | **Resend**（免費 3000 封/月、100 封/天） |
| Search | Pagefind（靜態檔索引，與 `@nuxt/content` 整合佳）|
| Dark Mode | `@nuxtjs/color-mode` |
| i18n | `@nuxtjs/i18n`（中／英） |
| 圖表 | Mermaid（`@nuxt/content` 內建支援） |
| 樣式 | Tailwind CSS + `@nuxt/ui` 或 shadcn-vue |

---

## 渲染策略（Hybrid：SSG + Edge API）

**不採用純 SPA**。原因：portfolio 重 SEO、需 OG 預覽、首屏要快、Pagefind 需靜態 HTML 才能建索引。
採用 Nuxt 3 內建的 **routeRules** 做混合渲染：靜態內容於 build 時預渲染成 HTML 並部署到 Cloudflare CDN，動態端點則跑在 Cloudflare Workers (Edge)。

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: { preset: 'cloudflare-pages' },
  routeRules: {
    // 靜態預渲染（build 時產生 HTML，CDN 直接吐）
    '/':              { prerender: true },
    '/about':         { prerender: true },
    '/skills':        { prerender: true },
    '/blog':          { prerender: true },
    '/blog/**':       { prerender: true },
    '/projects':      { prerender: true },
    '/projects/**':   { prerender: true },

    // ISR 風格：每 60 秒重新驗證一次（適合 guestbook 這種會變但不需即時的頁）
    '/guestbook':     { swr: 60 },

    // 純 SSR / 動態 API
    '/contact':       { ssr: true },
    '/api/**':        { cors: true },
  },
})
```

| 頁面 / 路徑 | 模式 | 為什麼 |
|---|---|---|
| `/`, `/about`, `/skills`, `/blog/**`, `/projects/**` | SSG / Prerender | 內容不常變動，要 SEO、要快 |
| `/guestbook` | SWR (60s) | 留言會新增但不需即時，stale-while-revalidate 兼顧速度與新鮮度 |
| `/contact` | SSR | 表單頁需動態 CSRF / Turnstile token |
| `/api/contact`、`/api/guestbook` | Edge Function | 跑在 Worker、操作 D1 與 MailChannels |

---

## 功能範圍（依使用者選擇）

### A. 必備基礎
1. **技術 Blog**（MDX + RSS）
   - 用 `@nuxt/content` 管理 `content/blog/*.md`
   - 自動產 RSS feed（`server/routes/rss.xml.ts`）
   - 含 syntax highlight、TOC、閱讀時間估算（`reading-time` 套件）
2. **Resume / CV PDF 下載**
   - 靜態 PDF 放在 `public/resume.pdf`
   - 加上 Hero / About 頁面的下載按鈕
3. **Contact Form（含後端）**
   - Server route `server/api/contact.post.ts`
   - Cloudflare Workers + **Resend API** 寄信（測試期用 `onboarding@resend.dev` 寄件，正式期可選綁網域）
   - 用 Cloudflare Turnstile 防垃圾、Workers KV 做 rate limiting
4. **Dark / Light Theme + i18n**
   - `@nuxtjs/color-mode` 切主題
   - `@nuxtjs/i18n` 切中／英，`locales/zh-TW.json`、`locales/en.json`

### B. 後端工程師差異化亮點
5. **系統設計 / 架構圖展示**
   - 每個專案頁 (`content/projects/*.md`) 內嵌 Mermaid 圖
   - 一個固定區塊「Tech Decisions」說明為什麼選 X 而不選 Y
   - C4 model（context / container / component）或 sequence diagram 為主

### C. 個人魅力內容
6. **Timeline / Career Journey**
   - `content/timeline.md` 或 YAML 驅動的職涯時間軸元件
7. **Skills Page**（`/skills`）
   - 技術能力總覽：依分類列出（Backend / Frontend / DevOps / Database / Cloud 等）
   - 每項可標註熟練度或「Adopt / Trial / Assess / Hold」Tech Radar 風格
   - 資料來源：`content/skills.yml`

### D. 互動性
9. **全站搜尋**
   - Pagefind 建索引涵蓋 blog + projects + pages
   - 用 Cmd/Ctrl+K 開啟搜尋 modal
10. **Guestbook + Webmentions**
    - Guestbook：D1 儲存留言（id, name, message, created_at, ip_hash）
    - GitHub OAuth 登入避免匿名洗版（用 `nuxt-auth-utils`）
    - Webmentions：整合 webmention.io，於 blog 文章下方顯示

---

## 專案結構（規劃）

```
grayson-portfolio/
├── app.vue
├── nuxt.config.ts
├── content/
│   ├── blog/                  # MDX 文章
│   ├── projects/              # 專案案例（含 mermaid 架構圖）
│   ├── skills.yml
│   └── timeline.yml
├── pages/
│   ├── index.vue              # Hero + 精選專案
│   ├── about.vue              # 個人資訊 + 學歷 + Timeline
│   ├── projects/[slug].vue
│   ├── blog/index.vue
│   ├── blog/[slug].vue
│   ├── skills.vue
│   ├── guestbook.vue
│   └── contact.vue
├── components/
│   ├── Hero.vue
│   ├── ThemeToggle.vue
│   ├── LangSwitcher.vue
│   ├── SearchModal.vue        # Pagefind UI
│   ├── ProjectCard.vue
│   ├── Timeline.vue
│   ├── SkillsMatrix.vue       # Skills 分類展示
│   ├── GuestbookForm.vue
│   └── Webmentions.vue
├── server/
│   ├── api/
│   │   ├── contact.post.ts    # 寄信 + Turnstile + rate limit
│   │   ├── guestbook.get.ts   # 列出留言
│   │   └── guestbook.post.ts  # 新增留言（需登入）
│   ├── routes/
│   │   └── rss.xml.ts
│   └── utils/
│       ├── db.ts              # D1 client
│       ├── mail.ts            # Resend API client
│       └── ratelimit.ts       # KV based
├── locales/
│   ├── zh-TW.json
│   └── en.json
├── public/
│   ├── resume.pdf
│   └── pagefind/              # build 時產出
├── migrations/                # D1 SQL migrations
│   └── 0001_init.sql
└── wrangler.toml              # Cloudflare 設定
```

---

## 實作階段（建議順序）

| 階段 | 內容 | 為何先做 |
|---|---|---|
| 1 | Nuxt 3 初始化、Tailwind、color-mode、i18n、基礎 layout | 打底，後續所有頁面都依賴 |
| 2 | 首頁 + About + 學歷 + Timeline + Resume PDF | 「最小可上線」版本就有了 |
| 3 | `@nuxt/content` 整合、Blog 列表 / 詳情頁、RSS、Mermaid | 內容導向核心 |
| 4 | Projects 頁面 + 架構圖展示模式（Tech Decisions 區塊） | 後端差異化亮點 |
| 5 | Skills 頁（分類 + 熟練度展示） | 純內容、快速完成 |
| 6 | Pagefind 全站搜尋 + Cmd-K modal | 等內容夠多再加 |
| 7 | Cloudflare D1 + wrangler 設定、Guestbook（GitHub OAuth） | 引入後端動態功能 |
| 8 | Contact Form（MailChannels + Turnstile + KV rate limit） | 需要 Cloudflare 設定齊全 |
| 9 | Webmentions 整合 | 最末，需要網站已上線取得 mentions |

---

## 費用（目標：$0/月）

所有外部服務皆使用免費方案，個人網站流量遠遠用不到上限。

| 服務 | 免費額度 | 預期用量 | 結論 |
|---|---|---|---|
| Cloudflare Pages | 每月 500 builds、無限頻寬 | 每天頂多幾次 build | ✅ 免費 |
| Cloudflare Workers | 100,000 reqs/天 | 個人網站每天 < 5000 | ✅ 免費 |
| Cloudflare D1 | 5GB、500 萬讀/天、10 萬寫/天 | guestbook 留言量極小 | ✅ 免費 |
| Cloudflare KV | 10 萬讀/天、1000 寫/天 | rate limit 用，量低 | ✅ 免費 |
| Cloudflare Turnstile | 無限 | — | ✅ 免費 |
| Resend | 3000 封/月、100 封/天 | Contact form 每月 < 50 封 | ✅ 免費 |
| GitHub OAuth | 無限 | — | ✅ 免費 |
| webmention.io | 無限（社群提供） | — | ✅ 免費 |
| 網域 | `*.pages.dev` 免費子網域 | 暫不買自訂網域 | ✅ 免費 |

**未來擴充注意事項**：
- 若想用自訂網域：Cloudflare Registrar `.com` 約 $10 USD/年（成本價無加成）
- 若 Resend 想用自己的網域寄件：需設定 DNS（SPF / DKIM / DMARC）；不設則僅能用 `onboarding@resend.dev` 當寄件者

---

## 關鍵設計決策

- **i18n 預設語言**：建議 `zh-TW` 為預設、`en` 為次語言（因為使用者主要受眾應為台灣）。
- **Blog 與 Projects 都用 `@nuxt/content`**：減少不同資料管道，統一作者體驗。
- **Guestbook 一定要 GitHub OAuth**：純文字匿名留言會被 spam bot 洗到死。
- **架構圖選 Mermaid 而非 Excalidraw export**：可在 markdown 內直接維護，diff 友好。
- **不上 Newsletter / Status Page / API Playground**：使用者沒選，避免過度工程。

---

## Critical Files（將被建立）

- `nuxt.config.ts`：modules 註冊、i18n locales、content config、nitro preset = `cloudflare-pages`
- `wrangler.toml`：D1 binding、KV binding、env vars
- `migrations/0001_init.sql`：guestbook table schema
- `server/api/contact.post.ts`、`server/api/guestbook.post.ts`：後端核心邏輯
- `content/`：所有內容資料來源
- `pages/projects/[slug].vue`：Projects 詳情頁（含架構圖區塊）

---

## Verification（驗證方式）

1. **本地開發**：`pnpm dev` → 開 `http://localhost:3000`
   - 切主題、切語言、瀏覽 blog / projects 都應正常
2. **內容渲染**：建立一篇含 Mermaid 的 MDX 試文，確認圖能渲染、code 區塊有 syntax highlight
3. **Pagefind**：`pnpm build && pnpm pagefind` 後在 Cmd-K modal 試打 keyword
4. **D1 / Guestbook**：`wrangler d1 execute <DB> --file=migrations/0001_init.sql`，本地 `wrangler pages dev` 試送出留言
5. **Contact Form**：用 `wrangler tail` 看 Worker log 確認 mail 送出與 rate limit 啟用
6. **部署**：push 到 GitHub、Cloudflare Pages 自動建置、確認線上 RSS、`/sitemap.xml`、Pagefind 索引能取得
7. **Lighthouse**：Performance / Accessibility / SEO 三項目標 ≥ 90

---

## 下一步

待此計畫核可後，會從「階段 1：Nuxt 3 初始化」開始實作。
若使用者想先確認任一階段的更細設計（例如 i18n 字串結構、D1 schema），可在開始實作前再深入討論。
