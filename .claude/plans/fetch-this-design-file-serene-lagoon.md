# Portfolio 個人網站 — 設計整合與實作計畫（v2）

## Context

使用者已從 Claude Design (claude.ai/design) 匯出一份 wireframe handoff bundle，本計畫整合：
1. **既有計畫**：`.claude/plans/portfolio-blog-composed-island.md`（技術棧、後端、部署、費用）
2. **新匯入設計**：日系米色 + φ 黃金比例幾何系統的 wireframe（含 8 個區塊 19 個 artboards）

整合後的目的是：**以 Nuxt 3 + Cloudflare 為技術底座**，**以日系米色 φ 幾何為視覺語言**，重現設計檔的視覺。設計檔是 HTML/CSS prototype，需 **pixel-perfect** 重建為 Vue 元件，不照抄 prototype 內部結構。

設計檔位置（已解壓於 `/tmp/design-extract/design/portfolio/`）：
- `README.md` — handoff 說明
- `chats/chat1.md` — 設計過程對話
- `project/index.html` — design tokens + 主入口
- `project/artboards.jsx` — 所有頁面版型（1157 行）
- `project/design-canvas.jsx` / `tweaks-panel.jsx` — 預覽容器（**不需移植**）

---

## 使用者確認的設計選擇

| 項目 | 選擇 | 備註 |
|---|---|---|
| Hero 版本 | **Hero A**（水平 φ 線） | 主水平線 y = H·φ⁻²、頂部 echo、右下大標 |
| Projects 版型 | **list 預設** | 不做 grid / collage 切換 |
| Skills 呈現 | **grid 4 欄分類** | Backend / Frontend / DevOps / Database |
| Timeline 版型 | **垂直履歷側欄** | 左 sidebar + 右時序事件 |
| Guestbook | 保留（D1 + GitHub OAuth） | 與設計檔風格一致延伸 |
| Pagefind 搜尋 | 保留（Cmd+K） | 內容夠多後啟用 |
| Webmentions | 保留 | 部署後加入 |
| Cool accent | 預設 **pine** `#3a5a4a` | 與既有 plan 的「溫馨中帶冷冽」相符 |
| Density | 預設 **low**（`--density-line: 0.3`） | 視覺乾淨優先 |
| Tweaks 切換 | **不在正式站開放** | 只在開發期作為 design reference |

---

## 設計系統 Tokens（從 index.html 抽出）

### 1. 顏色（CSS Custom Properties → Tailwind theme）

```css
:root {
  --bg:    #efe6d4;   /* 米色 base */
  --paper: #f6efde;   /* 偏亮卡片底 */
  --ink:   #1f1f1f;   /* 主線稿/文字（近黑） */
  --ink2:  #6a6256;   /* 暖灰（次文字） */
  --line:  #c9bfa9;   /* 淺米格線 */
  --cool:  #3a5a4a;   /* pine 冷色（預設） */
  --warm:  #b35a3a;   /* 磚紅（極少量重點） */
}

/* Dark mode（既有 plan 要求，設計檔未畫，需自行延伸） */
[data-theme="dark"] {
  --bg:    #1a1815;
  --paper: #232019;
  --ink:   #efe6d4;
  --ink2:  #a89b85;
  --line:  #3a352c;
  --cool:  #6b9a85;   /* pine 提亮版 */
  --warm:  #d97a5a;
}
```

### 2. 字體（Google Fonts 預連接）

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Space+Mono:wght@400;700&family=Shippori+Mincho:wght@400;600;800&display=swap" rel="stylesheet" />
```

| Family | 用途 | Class |
|---|---|---|
| **Shippori Mincho** (800) | Hero 大標、各頁日系標題 | `.font-mincho` |
| **Space Mono** (400/700) | label、body、code、navitem | `.font-mono`（default） |
| **Caveat** (400/600) | 手寫註解、簽名感註記 | `.font-hand` |

字級對照：
- `.hero-big`: Shippori Mincho 800 / 144px / line-height 0.95
- `.hero-sub`: Space Mono / 12px / letter-spacing 0.04em / opacity 0.7
- `.hero-byline`: Space Mono / 11px / opacity 0.7
- `.label`: Space Mono / 11px / letter-spacing 0.02em
- `.note`: Space Mono / 12px / line-height 1.55 / opacity 0.85
- `.hand`: Caveat / 20px / line-height 1.2 / opacity 0.9
- 區塊大標（如 About）: Shippori Mincho / 42px / line-height 1.15

### 3. 黃金比例幾何常數

```ts
// composables/usePhi.ts
export const PHI = 1.6180339887;
export const PHI_INV = 0.6180339887;       // 1/φ
export const PHI_INV2 = 0.3819660113;      // 1/φ²
// 任何裝飾線端點都應落在 0.382 / 0.618 / 0.236 / 0.146 等 φ 切點
```

### 4. 共用 atomic 元件（轉為 Vue components）

| 設計檔元件 | Vue 元件 | 用途 |
|---|---|---|
| `TopBar` | `<SiteHeader>` | 固定 56px、左 mark+date / 中導覽 / 右 lang+theme pill |
| `FootBar` | `<SiteFooter>` | 固定 36px、版權+slogan+scroll 提示 |
| `Label`/`Note`/`Hand` | `<WfLabel>`、`<WfNote>`、`<WfHand>` | 對應三種字體的文字組件 |
| `Bar` | `<WfBar>` | 文字 placeholder bar，正式版替換為真文字 |
| `Tick`/`Dots`/`TickWall` | `<WfTickWall>` | 裝飾刻度牆（左側 5 條短橫線） |
| `ImgPH` | `<WfImage>` | 圖片框架（含 caption），正式版傳 src |
| `PhiLines` | `<PhiLines>` | SVG 包裝器，依 page 寬高自動畫 φ 線 |

---

## 對應到的頁面（10 頁，含響應式）

依設計檔 + 既有 plan 路由：

| 路由 | 對應 Artboard | 渲染策略 | 關鍵設計細節 |
|---|---|---|---|
| `/` | HeroA + 精選 Projects | SSG | 大標「Grayson's Portfolio.」右下、水平 φ 線、左下 TickWall、cool 圓點落在 (W·φ⁻¹, H·φ⁻²) |
| `/projects` | ProjectsList | SSG | 編號 + Mincho 標題 + chip stack，水平 φ 線一條 |
| `/projects/[slug]` | ProjectDetail | SSG | 三欄頭資（編號/標題/年份）→ 全寬 cover → role/team/stack + brief/process → 雙圖（含 cool 圖塊） |
| `/blog` | BlogList | SSG | 主欄文章清單 + 右側 pinned + archive，chip filter 列 |
| `/blog/[slug]` | BlogDetail | SSG | 三欄（TOC / article / also reading），文章 lede 用 Mincho |
| `/about` | AboutPage | SSG | 左 portrait 460×400 + Hand caption，右大標 + now/previously/elsewhere |
| `/skills` | SkillsGrid | SSG | 4 欄分類，每欄 label + chip cluster |
| `/journey` | TimelineVert | SSG | 左 sidebar（年份索引）+ 右事件時序，含一條垂直 φ 主軸 |
| `/contact` | ContactSplit | SSR | 左聯絡資訊 + 右表單（Turnstile + Resend） |
| `/guestbook` | （新設計、延伸） | SWR 60s | 沿用 BlogList 風格 + 表單 |

響應式斷點：**375 mobile / 768 tablet / 1280+ desktop**。設計檔有 mobile-hero / mobile-projects / mobile-contact / tablet-hero 範例，須對應實作。

---

## 整合既有 plan 的實作順序

每階段都明列 **設計檔對應 artboard** 與 **驗證點**。

### 階段 0 · 設計系統先行（新增，原 plan 沒有）

> 為什麼放第一：之後所有頁面都引用這些 token，避免後改要全站翻新。

- [ ] 建立 `app/assets/css/tokens.css`：CSS variables（含 light/dark）
- [ ] 設定 Tailwind `theme.extend`：colors、fontFamily、letterSpacing、fontSize 對應上表
- [ ] 安裝 Google Fonts（透過 `@nuxtjs/google-fonts` 模組，避免 FOUT）
- [ ] 建立 `composables/usePhi.ts`（匯出 PHI 常數 + helper）
- [ ] 建立 `<PhiLines>` 元件：接受 `width`、`height`、`variant`（A/B/C/D）渲染 SVG
- [ ] 建立 atomic 元件：`<WfLabel>`、`<WfNote>`、`<WfHand>`、`<WfBar>`、`<WfTickWall>`、`<WfImage>`、`<WfChip>`、`<WfButton>`、`<WfPill>`
- [ ] 建立 `<SiteHeader>` / `<SiteFooter>` 共用骨架（含 lang + theme pill）

**驗證**：建立一個 `/playground` 路由放所有 atomic 元件，視覺對照設計檔 manifesto 區塊。

### 階段 1 · Nuxt 3 初始化（原 plan 階段 1）

依原 plan 不變，但 modules 清單明確化：

```ts
modules: [
  '@nuxtjs/tailwindcss',
  '@nuxtjs/color-mode',
  '@nuxtjs/i18n',
  '@nuxtjs/google-fonts',
  '@nuxt/content',
  // 'nuxt-auth-utils' (階段 7)
]
```

`@nuxtjs/google-fonts` 設定：

```ts
googleFonts: {
  families: {
    'Shippori Mincho': [400, 600, 800],
    'Space Mono': [400, 700],
    Caveat: [400, 600],
  },
  display: 'swap',
  preconnect: true,
}
```

### 階段 2 · Hero A + About + Resume PDF（原階段 2）

- [ ] `pages/index.vue`：HeroA 版型
  - 大標 `Grayson's Portfolio.` 用 `font-mincho text-[144px] leading-[0.95]`，右下絕對定位 `right-[60px] bottom-[90px] text-right`
  - 主水平 φ 線：`<PhiLines variant="hero-a" />` 渲染 y = H·φ⁻² 主線、頂部 echo、右側垂直 whisper、cool 圓點落在 (W·φ⁻¹, y_main)
  - 左上 `WfNote`：「— 01 / hello.\nportfolio of grayson」
  - 左中 `WfLabel`：「N° 2026 — 04」
  - 左下 `<WfTickWall count="5" length="56" gap="16" />`
  - 下方接 「精選 3 個 Projects」區（沿用 ProjectsList 樣式 list 前 3 筆）
- [ ] `pages/about.vue`：AboutPage 版型
  - 左 400×460 portrait + Caveat 手寫 caption
  - 右上 Mincho 42px 大標
  - now / previously / elsewhere 三欄
  - 接 Timeline（直接呼叫 `/journey` 同元件 `<TimelineVert>`）
- [ ] `public/resume.pdf` 放置
- [ ] About 頁底加下載按鈕（`<WfButton>` 風格）

**驗證**：對照 `index.html` 中的 HeroA、AboutPage 區塊，量取 padding（左右各 60、頂導覽 56、底資訊 36）、line stroke width（主線 1px、whisper 0.5px、opacity 0.55）。

### 階段 3 · Blog + Mermaid + RSS（原階段 3）

- [ ] `@nuxt/content` 設定 + `content/blog/*.md`
- [ ] `pages/blog/index.vue`：BlogList 版型（左主欄 + 右 pinned/archive）
  - chip filter：`['all', 'css', 'type', 'craft', 'motion', 'meta']`
  - 文章列每筆：date(label) + read time(label) → Mincho 24px 標題 → chip + 灰 bar
- [ ] `pages/blog/[slug].vue`：BlogDetail 版型（左 TOC / 中文章 / 右 also reading）
  - Lede 段用 Mincho 20px / line-height 1.5
  - Figure caption 用 Caveat
- [ ] `server/routes/rss.xml.ts`：RSS feed
- [ ] Mermaid 整合：用 `@nuxt/content` 內建 `<MermaidBlock>` 或 `mermaid` 包

**驗證**：寫一篇 sample.md 含 mermaid + code block，確認語法高亮 + 圖表渲染、TOC 有 active highlight。

### 階段 4 · Projects + Mermaid 架構圖（原階段 4）

- [ ] `pages/projects/index.vue`：ProjectsList 版型
  - 表格化每筆：`編號 / Mincho 標題 / 一行描述 / chips / 連結`，列間 1px var(--line) 分隔
  - 一條水平 φ 線（y = H·φ⁻¹）作為背景
- [ ] `pages/projects/[slug].vue`：ProjectDetail 版型
  - 三欄頭資 grid：70px / 1fr / 200px（`編號 /` `Mincho 56px 標題 + 22px 副標` `年份 · case study`）
  - cover 全寬 420 高
  - role/team/stack（左 1fr）+ brief/process（右 2fr）
  - 雙圖 grid 2fr/1fr，其中一張用 var(--cool) 底
  - 「Tech Decisions」區塊：嵌入 Mermaid 圖 + 文字段落
  - 底部「← 上一篇 / 下一篇 →」

**驗證**：對照 artboards.jsx line 410-512 的 ProjectDetail，確認 grid 比例、間距、cool 圖塊位置。

### 階段 5 · Skills grid（原階段 5）

- [ ] `pages/skills.vue`：SkillsGrid 版型
  - 4 欄分類：Backend / Frontend / DevOps / Database
  - 每欄：類別 label → chip cluster → 一行手寫註解（Caveat）
  - 資料來源 `content/skills.yml`
- [ ] 一條 φ 線斜貫背景（opacity 0.45）

**驗證**：對照設計檔 SkillsGrid，量取欄寬比例。

### 階段 6 · Timeline 垂直版 + 全站搜尋（合併原 5/6）

- [ ] `pages/journey.vue`：TimelineVert 版型
  - 左 sidebar（年份索引、總數）
  - 右事件時序：每筆 `年份(label) → 公司/角色(Mincho) → 描述(note) → tags(chip)`
  - 中間一條垂直 φ 主軸（x = W·φ⁻²）
- [ ] 資料來源 `content/timeline.yml`
- [ ] Pagefind 整合 + Cmd+K modal
  - modal 用米色背景 + 1px ink border，輸入框 var(--paper)
  - 結果列表沿用 BlogList 樣式

**驗證**：build 後 `/pagefind/` 目錄產出、Cmd+K 可搜尋 blog + projects 內容。

### 階段 7 · Cloudflare D1 + Guestbook（原階段 7）

- [ ] `wrangler.toml` 設定 D1 binding
- [ ] `migrations/0001_init.sql`：guestbook table
- [ ] `nuxt-auth-utils` 整合 GitHub OAuth
- [ ] `pages/guestbook.vue`：沿用 BlogList 樣式
  - 上：留言表單（GitHub 登入提示 + textarea + submit）
  - 下：留言列表（每筆 GitHub avatar 圓 + name + date(label) + 留言 note）
  - 背景一條 φ 線

**驗證**：本地 `wrangler pages dev` 試送出留言、未登入時看到 OAuth 引導。

### 階段 8 · Contact Form（原階段 8）

- [ ] `pages/contact.vue`：ContactSplit 版型
  - 左欄：聯絡資訊（email / GitHub / location，每項 label + value）
  - 右欄：表單 fields（name / email / message / submit）
  - 每個 input：height 38、border 1px var(--ink)、bg var(--paper)、margin-top 6
- [ ] `server/api/contact.post.ts`：Resend + Turnstile + KV rate limit
- [ ] Submit 後顯示 Caveat 風格 success note

**驗證**：實際送一封信，確認 Resend dashboard 收到、rate limit 啟動。

### 階段 9 · Webmentions + 部署優化（原階段 9）

- [ ] webmention.io 註冊 + 在 blog detail 底部顯示 mentions
- [ ] sitemap.xml、OG image generation
- [ ] Lighthouse 90+ 三項

---

## 響應式策略

設計檔有 `TabletHero`、`MobileHero`、`MobileProjects`、`MobileContact` 範例。

| 斷點 | 處理 |
|---|---|
| `< 768` (mobile) | TopBar 摺成漢堡選單、Hero 大標縮 64px、左側裝飾元素隱藏、grid 改單欄 |
| `768 – 1279` (tablet) | TopBar 維持、Hero 大標 96px、3 欄 grid 改 2 欄 |
| `≥ 1280` (desktop) | 原版型 |

Tailwind breakpoints 沿用預設（sm 640 / md 768 / lg 1024 / xl 1280）。每個元件用 `lg:` prefix 套桌機版，預設用 mobile-first。

---

## Critical Files（將建立）

- `nuxt.config.ts` — modules、i18n、content、googleFonts、nitro `cloudflare-pages`、routeRules
- `tailwind.config.ts` — theme.extend 整合 design tokens
- `app/assets/css/tokens.css` — CSS variables（light + dark）
- `composables/usePhi.ts` — φ 常數 + helper functions
- `components/atoms/`：`WfLabel/Note/Hand/Bar/Chip/Button/Pill/TickWall/Image.vue`
- `components/PhiLines.vue` — 接受 variant prop 渲染對應 φ 線
- `components/SiteHeader.vue` / `SiteFooter.vue`
- `components/Hero.vue` — Hero A 實作
- `pages/`：index / about / blog/[index,[slug]] / projects/[index,[slug]] / skills / journey / contact / guestbook
- `content/`：blog/ projects/ skills.yml timeline.yml
- `server/api/`：contact.post.ts / guestbook.{get,post}.ts
- `migrations/0001_init.sql`
- `wrangler.toml`

---

## 驗證方式（visual + functional）

1. **設計系統視覺對照**
   - 建立 `/playground` 路由展示所有 atomic 元件
   - 把設計檔在瀏覽器 open 對照（兩個視窗並排，量 px）
   - 驗收標準：色票、字體、字級、字距與設計檔 ±2px 內一致

2. **每階段對照 artboard**
   - 每完成一個 page 開瀏覽器並排設計檔 / 本地，重點檢查：
     - φ 線端點是否落在 0.382 / 0.618 切點
     - 大標位置是否在右下 `right: 60; bottom: 90`
     - cool 圓點是否落在 φ 交點
     - TickWall 條數 / 長度遞減規律
   - 響應式 375 / 768 / 1280 三斷點手動切換

3. **內容渲染**：sample.md 含 mermaid → 圖表 + syntax highlight 正常

4. **搜尋**：`pnpm build && pnpm pagefind`，Cmd+K 試打 keyword

5. **後端**：`wrangler pages dev` 本地測 contact form 寄信、guestbook 留言

6. **部署**：push → CF Pages 自動 build → 線上驗證 RSS、sitemap、Pagefind 索引

7. **Lighthouse**：Performance / Accessibility / SEO ≥ 90

---

## 關鍵設計決策（與既有 plan 差異）

| 項目 | 既有 plan | 整合後 |
|---|---|---|
| UI Library | Tailwind + `@nuxt/ui` 或 shadcn-vue | **純 Tailwind**（避免 UI lib 覆蓋米色主題） |
| Timeline 位置 | 嵌在 `/about` | **獨立 `/journey` 路由**（與設計檔 nav 一致） |
| 字體 | 未指定 | **Shippori Mincho + Space Mono + Caveat** |
| 主視覺語言 | 未指定 | **φ 黃金比例 + 米色 + cool 圓點** |
| 預設語言 | zh-TW | **維持 zh-TW 預設**，但設計檔字體偏英文呈現，需確認中文 fallback（Shippori Mincho 對中文有限，中文 fallback 用 Noto Serif TC） |
| Tweaks Panel | 無 | **不在正式站開放**，只作開發期 reference |

---

## 風險與待議事項

1. **Shippori Mincho 對中文支援有限**：須加 Noto Serif TC 作為 fallback，或中文標題改用 Noto Serif TC 為主
2. **Dark mode 配色設計檔未畫**：本計畫已自行延伸（米色反相），實作時需肉眼驗證
3. **i18n 與設計檔大標衝突**：設計檔大標是「Grayson's Portfolio.」英文 — 中文版需另想標題（建議「XXX的作品集」用 Noto Serif TC）
4. **Tweaks 是否上線**：若日後想開放，建議只放冷色 hue（4 選 1），density 不需要

---

## 下一步

待此計畫核可後，從 **階段 0：設計系統先行** 開始實作。
若想先確認任一階段細節（如 Tailwind theme.extend 完整內容、PhiLines variant API、Hero A 元件骨架），可在進入 implementation mode 後再深入。
