## 1. Schema & Frontmatter

- [x] 1.1 在 `content.config.ts` 的 projects collection schema 加入 `category: z.enum(['product', 'system', 'side', 'identity'])`
- [x] 1.2 修改 `content/projects/01-field.md`：把 `title` 改成 `Field`，`subtitle` 改成 `— design system`，加 `category: system`
- [x] 1.3 修改 `content/projects/02-hina.md`：把 `title` 改成 `Hina`，`subtitle` 改成 `— payments console`，加 `category: product`

## 2. New Content Samples

- [x] 2.1 新增 `content/projects/03-kata.md`（title: `Kata`、subtitle: `— type specimen`、category: `side`、`date: 2024-03-01`，其他 frontmatter 補齊；body 用 `> WIP — full case study coming.`）
- [x] 2.2 新增 `content/projects/04-mori.md`（title: `Mori`、subtitle: `— map editor`、category: `product`、`date: 2025-01-01`，body WIP placeholder）
- [x] 2.3 新增 `content/projects/05-foglight.md`（title: `Foglight`、subtitle: `— observability`、category: `product`、`date: 2025-05-01`，body WIP placeholder）
- [x] 2.4 新增 `content/projects/06-hako.md`（title: `Hako`、subtitle: `— packaging studio`、category: `identity`、`date: 2022-08-01`，body WIP placeholder）

## 3. List Page — Layout & Header

- [x] 3.1 改寫 `app/pages/projects/index.vue`：頁面容器加 `bg-[var(--paper)]`
- [x] 3.2 加入雙欄結構：`lg:grid lg:grid-cols-[3fr_2fr] lg:gap-12`（行動裝置維持單欄，preview panel `hidden lg:block`）
- [x] 3.3 Header 左：`— 02 / projects · {{ visibleCount }} selected`
- [x] 3.4 Header 右：4 個 filter tab（`all` / `product` / `system` / `side`），active tab 加底線或粗體區分

## 4. List Page — Rows

- [x] 4.1 Row grid 改為 5 欄：`grid-cols-[40px_60px_1fr_120px]` + mouseenter handler（最後一欄為 hover 反應，不獨立 grid col）
- [x] 4.2 Col 1：zero-padded index（`01`–`06`）
- [x] 4.3 Col 2：4 位數年份
- [x] 4.4 Col 3：`<div>` 內含 serif title (`font-mincho text-[32px]`) + subtitle (`font-mono text-[13px] opacity-60`)
- [x] 4.5 Col 4：單一 category label，右對齊小寫 mono
- [x] 4.6 移除原本的 stack chips 與 `→` arrow
- [x] 4.7 Row hover 樣式：使用 `bg-[#f0e9d8]` inline（`--paper-warm` token 不存在，已於此標註 token 缺口）
- [x] 4.8 每列底部 `border-b border-[var(--line)]`

## 5. Preview Panel

- [x] 5.1 加入 `selectedProject` ref，預設第一個項目；mouseenter row 時更新；mouseleave 不重設
- [x] 5.2 Preview panel 容器：`lg:block hidden`，含 label `preview · hover`
- [x] 5.3 預覽區：`aspect-[4/3]` 或固定高度，背景使用 CSS `repeating-linear-gradient(45deg, var(--ink) 0 1px, transparent 1px 8px)` 製作 45° 斜線紋路
- [x] 5.4 預覽區中央疊一個 chip：`{{ index }} - {{ selectedProject.title }}`（白底窄 border）
- [x] 5.5 預覽區下方：3 行內 description（先用 `selectedProject.subtitle` 或新增 frontmatter `previewBlurb` — 本 change 用 subtitle 即可）
- [x] 5.6 預覽區下方 tech tag pills（圓角 `rounded-full`，font-mono text-[11px]）：從 `selectedProject.stack` 渲染

## 6. Filter Behavior

- [x] 6.1 加入 `activeCategory` ref（預設 `all`）
- [x] 6.2 `visibleProjects` computed：`all` 回全部，否則 `projects.filter(p => p.category === activeCategory)`
- [x] 6.3 Header 計數使用 `visibleProjects.length`
- [x] 6.4 Filter 切換時 `selectedProject` 若不在新清單則自動切到新清單第一個

## 7. Verification

- [x] 7.1 `pnpm dev`：`/projects` 顯示 6 列、5 欄結構、header 左側顯示 `· 6 selected`
- [x] 7.2 Hover 任一列：右側 preview panel 即時切換，mouseleave 後 preview 保留最後 hover
- [x] 7.3 切換 filter（如 `product`）：list 只剩對應 category 的項目，header 計數同步更新
- [x] 7.4 視口寬度 < lg：preview panel 隱藏，list 滿版單欄
- [x] 7.5 `pnpm build`：schema 驗證通過（含 `category` enum）；輸出 `/projects/index.html`
- [x] 7.6 `/projects/01-field` 與 `/projects/02-hina` detail page 仍可正常 render（未受本 change 影響）
