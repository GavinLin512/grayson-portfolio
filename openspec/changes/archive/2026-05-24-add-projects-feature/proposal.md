## Why

Projects 案例是後端工程師差異化亮點，含「Tech Decisions」Mermaid 架構圖區塊。透過 `@nuxt/content` 管理，frontmatter 結構化欄位（role / team / stack / cover / screens），正文留給敘事與架構圖。

## What Changes

- 建立 `content/projects/` 目錄，寫 2 個 sample（frontmatter: `title/subtitle/year/role/team/stack/cover/screens`）
- 新增 `app/pages/projects/index.vue`：ProjectsList（每筆 編號 / Mincho 標題 / 一行 subtitle / chips / 連結，列間 1px var(--line)）+ 水平 φ 線 `y=61.8%`
- 新增 `app/pages/projects/[slug].vue`：ProjectDetail
  - `grid-cols-[70px_1fr_200px]` 三欄頭資
  - 全寬 cover 圖（h=420）
  - `grid-cols-[1fr_2fr]` role/team/stack + brief/process
  - `grid-cols-[2fr_1fr]` 雙圖，第二張 `bg-cool`
  - 「Tech Decisions」區塊嵌 Mermaid
  - 底部 prev/next 連結（queryContent 排序取相鄰）

## Capabilities

### New Capabilities
- `projects-feature`：專案案例展示系統，frontmatter 結構化 + Mermaid 架構圖 + prev/next 導覽

### Modified Capabilities
（無）

## Impact

- 新增檔案：`app/pages/projects/index.vue`、`app/pages/projects/[slug].vue`、`content/projects/*.md`
- 依賴：`add-shared-layout`（若 `add-blog-feature` 已先 install `@nuxt/content` 則共享，否則本 change install）
- 路由：`/projects`、`/projects/[slug]` SSG prerender
