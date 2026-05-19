# Portfolio 個人網站 — 設計整合與實作計畫（v3）

## Context

使用者已從 Claude Design (claude.ai/design) 匯出一份 wireframe handoff bundle，本計畫整合：
1. **既有計畫**：`.claude/plans/portfolio-blog-composed-island.md`（技術棧、後端、部署、費用）
2. **新匯入設計**：日系米色 + φ 黃金比例幾何系統的 wireframe（含 8 個區塊 19 個 artboards）

設計檔位置（已解壓於 `/tmp/design-extract/design/portfolio/`）：
- `project/index.html` — design tokens + 主入口
- `project/artboards.jsx` — 所有頁面版型（1157 行）

---

## 確認的決策清單（來自 grill session）

| # | 項目 | 決策 |
|---|---|---|
| 1 | 大標語言 | 全站保持英文，不翻譯 |
| 2 | i18n | **暫緩到 MVP 之後**，不安裝 `@nuxtjs/i18n`，不建 `locales/` |
| 3 | PhiLines SSG | SVG `preserveAspectRatio="none"` 撐滿父容器（不用 useElementSize） |
| 4 | CSS 系統 | Tailwind theme 包 CSS Variables（`colors: { bg: 'var(--bg)' }`） |
| 5 | Dark mode | `@nuxtjs/color-mode` + Tailwind 統一 `class` 策略，CSS 用 `.dark {}` |
| 6 | 目錄結構 | Nuxt 3 `app/` 新慣例（`app/assets/`、`app/components/`、`app/pages/`） |
| 7 | Markdown | 純 Markdown + Mermaid，不需要 MDX |
| 8 | Pagefind build | CF Pages build command：`nuxt build && pagefind --site .output/public`；本地 dev 靜默 fallback |
| 9 | GitHub OAuth | 本地 `.env` / CF Pages Dashboard 兩組 key 分開管理 |
| 10 | D1 本地開發 | 接受兩種啟動指令（`nuxt dev` 純前端 / `wrangler pages dev` 測後端） |
| 11 | 階段 0 元件 | 只建正式版沿用的元件，不建 `Wf*` placeholder 系列 |
| 12 | PhiLines API | 接受 `lines` 陣列，座標由各頁面傳入（不用 variant switch） |
| 13 | 首頁 MVP | 只做 Hero A，精選 Projects 先不做 |
| 14 | Project frontmatter | role/team/stack/year/cover/screens 在 frontmatter，正文留 brief/process/Mermaid |
| 15 | About 內容 | 拿掉 now/previously，職涯資訊由 `/journey` 承擔 |
| 16 | About portrait | 用 `--cool` + `--bg` 幾何色塊替代真人照 |
| 17 | Hero 版本 | Hero A（水平 φ 線） |
| 18 | Projects 版型 | list 預設，不做 grid / collage 切換 |
| 19 | Skills 呈現 | grid 4 欄分類（Backend / Frontend / DevOps / Database） |
| 20 | Timeline 版型 | 垂直履歷側欄（左 sidebar + 右時序） |
| 21 | Cool accent | 預設 pine `#3a5a4a` |

---

## 設計系統 Tokens

### 顏色

```css
/* app/assets/css/tokens.css */
:root {
  --bg:    #efe6d4;
  --paper: #f6efde;
  --ink:   #1f1f1f;
  --ink2:  #6a6256;
  --line:  #c9bfa9;
  --cool:  #3a5a4a;   /* pine */
  --warm:  #b35a3a;
}

/* Dark mode — 設計檔未畫，自行延伸，需肉眼驗證 */
.dark {
  --bg:    #1a1815;
  --paper: #232019;
  --ink:   #efe6d4;
  --ink2:  #a89b85;
  --line:  #3a352c;
  --cool:  #6b9a85;
  --warm:  #d97a5a;
}
```

```ts
// tailwind.config.ts
export default {
  darkMode: 'class',   // 與 @nuxtjs/color-mode 一致
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', paper: 'var(--paper)',
        ink: 'var(--ink)', ink2: 'var(--ink2)',
        line: 'var(--line)', cool: 'var(--cool)', warm: 'var(--warm)',
      },
      fontFamily: {
        mincho: ['Shippori Mincho', 'serif'],
        mono:   ['Space Mono', 'monospace'],
        hand:   ['Caveat', 'cursive'],
      },
    },
  },
}
```

### 字體

| Family | 用途 | Tailwind class |
|---|---|---|
| Shippori Mincho 800 | Hero 大標、各頁日系標題 | `font-mincho` |
| Space Mono 400/700 | label、body、navitem（預設字體） | `font-mono` |
| Caveat 400/600 | 手寫註解、portrait caption | `font-hand` |

字級（直接用 Tailwind arbitrary value）：
- Hero 大標：`text-[144px] leading-[0.95] font-mincho font-extrabold`（mobile: `text-[64px]`、tablet: `text-[96px]`）
- 區塊大標：`text-[42px] leading-[1.15] font-mincho`
- label：`text-[11px] font-mono tracking-[0.02em]`
- note：`text-[12px] font-mono leading-[1.55] opacity-85`
- hand：`text-[20px] font-hand leading-[1.2] opacity-90`

### 黃金比例常數

```ts
// app/composables/usePhi.ts
export const PHI_INV  = 0.6180339887   // 1/φ — 大分割
export const PHI_INV2 = 0.3819660113   // 1/φ² — 小分割
```

### PhiLines 元件

```vue
<!-- app/components/PhiLines.vue -->
<!-- lines: { x1, y1, x2, y2, width?, opacity? }[] -->
<!-- dot?: { cx, cy, r? } -->
<!-- 全部座標用百分比字串（'61.8%'）或數字（px） -->
<PhiLines :lines="[
  { x1: 0, y1: '38.2%', x2: '100%', y2: '38.2%', width: 1 },
  { x1: '61.8%', y1: '8%', x2: '61.8%', y2: '94%', width: 0.5, opacity: 0.4 },
]" :dot="{ cx: '61.8%', cy: '38.2%' }" />
```

SVG 固定 `viewBox="0 0 100 100"` + `preserveAspectRatio="none"` + `position: absolute; inset: 0; width: 100%; height: 100%`。

---

## 頁面路由表

| 路由 | 渲染策略 | 設計檔 artboard | 關鍵設計細節 |
|---|---|---|---|
| `/` | SSG | HeroA | 大標右下、水平 φ 線、左下 TickWall、cool 圓點 |
| `/projects` | SSG | ProjectsList | 編號+Mincho+chip，水平 φ 線 |
| `/projects/[slug]` | SSG | ProjectDetail | frontmatter 三欄頭資、cover、role/stack、Mermaid |
| `/blog` | SSG | BlogList | 主欄清單+右側 pinned/archive，chip filter |
| `/blog/[slug]` | SSG | BlogDetail | 三欄（TOC/article/also reading），lede 用 Mincho |
| `/about` | SSG | AboutPage | 幾何色塊 portrait + Caveat caption，Mincho 大標（無 now/previously） |
| `/skills` | SSG | SkillsGrid | 4 欄分類，chip cluster |
| `/journey` | SSG | TimelineVert | 左 sidebar 年份索引 + 右事件時序 |
| `/contact` | SSR | ContactSplit | 左聯絡資訊 + 右表單（Turnstile + Resend） |
| `/guestbook` | SWR 60s | 延伸設計 | BlogList 風格 + 留言表單 |

---

## 實作階段

### 階段 0 · 設計系統先行

> 所有頁面都引用這些 token，放第一避免後改全站翻新。

- [ ] 補齊 `.gitignore`（node_modules、.nuxt、.output、.wrangler、.env、.DS_Store）
- [ ] 建立 `app/assets/css/tokens.css`：CSS variables（light + .dark）
- [ ] 設定 `tailwind.config.ts`：`darkMode: 'class'`，colors/fontFamily 對應上表
- [ ] 安裝 `@nuxtjs/google-fonts`，設定 Shippori Mincho / Space Mono / Caveat
- [ ] 建立 `app/composables/usePhi.ts`（匯出 PHI_INV、PHI_INV2）
- [ ] 建立 `app/components/PhiLines.vue`（lines 陣列 API + SVG preserveAspectRatio="none"）
- [ ] 建立正式版沿用的共用元件：
  - `app/components/SiteHeader.vue`（56px、左 mark / 中 nav / 右 theme pill）
  - `app/components/SiteFooter.vue`（36px、版權 + slogan + scroll）
  - `app/components/TickWall.vue`（count/length/gap props）
  - `app/components/TagChip.vue`（chip 樣式）
  - `app/components/GeoPortrait.vue`（幾何色塊 portrait，About 用）
- [ ] `nuxt.config.ts`：`colorMode: { classSuffix: '' }`

**驗證**：建立 `/playground` 路由，放 SiteHeader、SiteFooter、PhiLines、TickWall、TagChip、GeoPortrait，視覺對照設計檔 manifesto 區塊。

### 階段 1 · Nuxt 3 初始化

```ts
// nuxt.config.ts modules
modules: [
  '@nuxtjs/tailwindcss',
  '@nuxtjs/color-mode',
  '@nuxtjs/google-fonts',
  '@nuxt/content',
  // '@nuxtjs/i18n' — 暫緩
  // 'nuxt-auth-utils' — 階段 7
]

nitro: { preset: 'cloudflare-pages' }

colorMode: { classSuffix: '', preference: 'system', fallback: 'light' }

googleFonts: {
  families: { 'Shippori Mincho': [400, 600, 800], 'Space Mono': [400, 700], Caveat: [400, 600] },
  display: 'swap',
  preconnect: true,
}

routeRules: {
  '/':            { prerender: true },
  '/about':       { prerender: true },
  '/skills':      { prerender: true },
  '/journey':     { prerender: true },
  '/blog':        { prerender: true },
  '/blog/**':     { prerender: true },
  '/projects':    { prerender: true },
  '/projects/**': { prerender: true },
  '/guestbook':   { swr: 60 },
  '/contact':     { ssr: true },
  '/api/**':      { cors: true },
}
```

**驗證**：`pnpm dev` 啟動無錯、`/playground` 可訪問。

### 階段 2 · Hero A + About + Resume PDF

**Hero A（`app/pages/index.vue`）**
- `<PhiLines>` 傳入：主水平線 y=38.2%（width:1）、頂部 echo y=23.6%（width:0.5, opacity:0.55）、垂直 whisper x=61.8%（width:0.5）、dot 落在 (61.8%, 38.2%)
- 左上 note：`— 01 / hello.\nportfolio of grayson`（`absolute left-[60px] top-[130px]`）
- 左中 label：`N° 2026 — 04`（`absolute left-[60px] top-[320px] opacity-55`）
- 左下 `<TickWall :count="5" :length="56" :gap="16" />`（`absolute left-[60px] bottom-[120px]`）
- 大標：`absolute right-[60px] bottom-[90px] text-right`，hero-sub + hero-big + hero-byline
- MVP 首頁到此結束，不接精選 Projects

**About（`app/pages/about.vue`）**
- 左側：`<GeoPortrait />` 400×460 + Caveat caption（`— grayson, somewhere in taipei.`）
- 右側：Mincho 42px 大標 + 純文字段落（無 now/previously）
- 底部：Resume PDF 下載按鈕（`<a href="/resume.pdf">`，border 1px ink 樣式）

**驗證**：並排設計檔 HeroA，量：左右 padding=60px、TopBar 高=56px、FootBar 高=36px、主水平線 y≈275px（720高時）、cool 圓點在交點。

### 階段 3 · Blog + Mermaid + RSS

**內容結構（frontmatter）**
```yaml
---
title: On grids that fail gracefully
date: 2026-04-12
readTime: 6
tags: [css]
pinned: true
---
```

- `app/pages/blog/index.vue`：BlogList 版型（左1.4fr清單 + 右1fr pinned/archive）
  - chip filter：`['all', 'css', 'type', 'craft', 'motion', 'meta']`
  - 每筆：date + readTime → Mincho 24px 標題 → chip
- `app/pages/blog/[slug].vue`：BlogDetail 版型（左180px TOC / 中1fr / 右180px also reading）
  - lede 段：`font-mincho text-[20px] leading-[1.5]`
  - figure caption：`font-hand`
- `server/routes/rss.xml.ts`：RSS feed
- Mermaid：`@nuxt/content` prose components 覆寫 `<pre code="mermaid">` → mermaid 渲染

**驗證**：寫一篇 sample.md 含 mermaid + fenced code，確認語法高亮 + 圖表渲染 + TOC active state。

### 階段 4 · Projects + Tech Decisions

**frontmatter 結構**
```yaml
---
title: Hina
subtitle: payments console
year: 2024
role: lead frontend
team: 3 eng · 1 designer · 1 pm
stack: [react, ts, d3, zod, temporal]
cover: /images/projects/hina-cover.jpg
screens:
  - /images/projects/hina-01.jpg
  - /images/projects/hina-detail.jpg
---
## Brief
...
## Process
...
## Tech Decisions
```mermaid
...
```
```

- `app/pages/projects/index.vue`：ProjectsList（編號 / Mincho標題 / 一行描述 / chips / 連結）
- `app/pages/projects/[slug].vue`：ProjectDetail
  - 三欄頭資 grid：`grid-cols-[70px_1fr_200px]`
  - 全寬 cover 420px 高
  - `grid-cols-[1fr_2fr]`：role/team/stack + brief/process
  - `grid-cols-[2fr_1fr]`：screen-01 + screen-02（screen-02 用 `bg-cool`）
  - Tech Decisions 區塊：Mermaid + 文字
  - 底部 prev/next 導覽

**驗證**：對照 artboards.jsx:457-512，確認 grid 比例、cool 圖塊。

### 階段 5 · Skills grid

- `app/pages/skills.vue`：SkillsGrid 4 欄（Backend / Frontend / DevOps / Database）
  - 每欄：label → chip cluster（`content/skills.yml`）
  - 一條 φ 對角線背景（opacity 0.45）

```yaml
# content/skills.yml
backend:   [Go, Python, Node.js, PostgreSQL, Redis]
frontend:  [Vue 3, Nuxt 3, TypeScript, Tailwind CSS]
devops:    [Docker, GitHub Actions, Cloudflare, Terraform]
database:  [PostgreSQL, D1, Redis, MongoDB]
```

**驗證**：對照設計檔 SkillsGrid，確認 4 欄比例、chip 樣式。

### 階段 6 · Timeline + Pagefind 搜尋

**Timeline（`app/pages/journey.vue`）**
- 左 sidebar（`w-[180px]`）：年份索引列表
- 中央垂直 φ 軸：x = W·φ⁻²（約 38.2%），`height: 100%`，1px ink
- 右主欄：每筆事件 → year label → Mincho 公司/角色 → note 描述 → chips

```yaml
# content/timeline.yml
- year: 2024
  company: Hina
  role: Lead Frontend Engineer
  description: ...
  tags: [vue, ts, payments]
```

**Pagefind（Cmd+K modal）**
```ts
// app/composables/usePagefind.ts
export async function initPagefind() {
  try {
    const pf = await import(/* @vite-ignore */ '/pagefind/pagefind.js')
    await pf.init()
    return pf
  } catch {
    return null   // 本地 dev 無索引時靜默跳過
  }
}
```
- modal：`bg-bg border border-ink`，input：`bg-paper border-ink h-[38px]`
- 結果列表沿用 BlogList 每列樣式

**驗證**：`pnpm build && npx pagefind --site .output/public`，Cmd+K 試搜尋 blog 關鍵字。

### 階段 7 · Guestbook（D1 + GitHub OAuth）

**兩種啟動指令**
- 純前端開發：`pnpm dev`
- 測後端（D1 / OAuth）：`wrangler pages dev .output/public --d1=DB`

**設定**
- `wrangler.toml`：D1 binding（name = `DB`）
- `migrations/0001_init.sql`：`guestbook(id, github_id, name, avatar, message, created_at, ip_hash)`
- `nuxt-auth-utils`：GitHub OAuth，callback = `/api/auth/github`
  - 本地：`NUXT_OAUTH_GITHUB_CLIENT_ID` / `NUXT_OAUTH_GITHUB_CLIENT_SECRET`（`.env`）
  - 正式：CF Pages Dashboard 設定

**`app/pages/guestbook.vue`**
- 上：未登入 → GitHub 登入按鈕；已登入 → textarea + submit
- 下：留言列表（GitHub avatar circle + name label + date label + message note）
- 背景一條水平 φ 線

**驗證**：`wrangler pages dev` 本地試送留言、未登入看到 OAuth 引導。

### 階段 8 · Contact Form

**`app/pages/contact.vue`**（ContactSplit 版型）
- 左欄（`w-[360px]`）：email / GitHub / location，每項 label + value
- 右欄：name / email / message / Turnstile widget / submit
  - input：`h-[38px] border border-ink bg-paper mt-[6px]`
  - submit 後顯示 Caveat 風格 success note

**`server/api/contact.post.ts`**：Resend + Turnstile 驗證 + KV rate limit（10 req/小時/IP）

**環境變數**

```bash
# .env（本地，不 commit）
NUXT_TURNSTILE_SITE_KEY=1x00000000000000000000AA
NUXT_TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
NUXT_RESEND_API_KEY=re_xxxx
NUXT_PUBLIC_CONTACT_EMAIL=your@email.com

# CF Pages Dashboard（正式，取自 Cloudflare Turnstile dashboard）
# NUXT_TURNSTILE_SITE_KEY=...
# NUXT_TURNSTILE_SECRET_KEY=...
```

> 測試 key 是 Cloudflare 官方公開 dummy key，任何域名永遠通過，commit 無妨。

**驗證**：送一封信確認 Resend dashboard 收到、rate limit 啟動。

### 階段 9 · Webmentions + 部署優化

- webmention.io 註冊 + blog detail 底部顯示 mentions（需網站已上線）
- `sitemap.xml`：`nuxt-simple-sitemap` 或手動 server route
- OG image：靜態圖或 Satori 動態產生
- Lighthouse Performance / Accessibility / SEO ≥ 90

---

## 響應式策略

| 斷點 | 處理 |
|---|---|
| `< 768`（mobile） | TopBar 摺漢堡選單、Hero 大標 `text-[64px]`、φ 裝飾元素隱藏（`lg:block hidden`）、grid 改單欄 |
| `768–1279`（tablet） | TopBar 維持、Hero 大標 `text-[96px]`、3 欄 grid 改 2 欄 |
| `≥ 1280`（desktop） | 原設計版型 |

慣例：Tailwind mobile-first，桌機版用 `lg:` prefix。

---

## .gitignore（完整，實作第一步補上）

```
.nuxt/
.output/
dist/
.wrangler/
node_modules/
.env
.env.*
!.env.example
.DS_Store
```

---

## Cloudflare Pages Build 設定

| 欄位 | 值 |
|---|---|
| Build command | `npx nuxt build && npx pagefind --site .output/public` |
| Build output directory | `.output/public` |
| Environment variable | `NODE_VERSION=20` |

---

## Critical Files（將建立）

- `.gitignore` — 補齊
- `nuxt.config.ts` — modules、colorMode、googleFonts、nitro、routeRules
- `tailwind.config.ts` — darkMode: class，colors/fontFamily
- `app/assets/css/tokens.css` — CSS variables（light + .dark）
- `app/composables/usePhi.ts` — PHI_INV、PHI_INV2
- `app/components/PhiLines.vue` — lines 陣列 API
- `app/components/SiteHeader.vue` / `SiteFooter.vue`
- `app/components/TickWall.vue` / `TagChip.vue` / `GeoPortrait.vue`
- `app/pages/`：index / about / blog/index / blog/[slug] / projects/index / projects/[slug] / skills / journey / contact / guestbook
- `content/`：blog/ projects/ skills.yml timeline.yml
- `server/api/`：contact.post.ts / guestbook.{get,post}.ts
- `server/routes/rss.xml.ts`
- `migrations/0001_init.sql`
- `wrangler.toml`
- `.env.example` — 列出所有環境變數 key（不含真實值）

---

## 驗證方式

1. `/playground` 視覺對照設計檔 manifesto 區塊（色票、字體、PhiLines、TickWall）
2. 每頁完成後：瀏覽器並排設計檔 artboard，量 padding/stroke/位置（±2px 內）
3. 響應式：375 / 768 / 1280 三斷點手動切換
4. Mermaid：sample.md 含 mermaid → 圖表 + syntax highlight 正常
5. Pagefind：build 後 Cmd+K 搜尋 blog 關鍵字
6. Guestbook：`wrangler pages dev` 本地送留言
7. Contact Form：實際寄信到 Resend dashboard
8. 部署：push → CF Pages build → 線上驗 RSS、sitemap、Pagefind
9. Lighthouse ≥ 90（三項）

---

## 下一步

從 **階段 0：設計系統先行** 開始實作。
