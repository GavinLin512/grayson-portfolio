## Why

`uiux-fix/blog/index.png` 為 blog 列表頁的最新 UI/UX 設計稿。目前 `app/pages/blog/index.vue` 雖然功能完整，但與設計稿在「視覺節奏」與「資訊密度」上仍有落差：tag filter 樣式偏簡陋、日期格式不一致、列表項缺少灰線裝飾、pinned 卡片過於單薄、archive 區塊資訊密度低。本次調整以「不增改功能、只精修視覺」為原則，把現有實作對齊設計稿。

## What Changes

- **Tag filter**：由 underline text 改為 **pill chip 樣式**（細邊框 + 圓角 9999px，沿用 `<TagChip>` 視覺語彙），active 狀態以填色或加粗外框區分
- **日期格式**：列表項與 pinned 卡片皆改為 `YYYY · MM · DD`（中點分隔，月日補零），mono 字體
- **閱讀時間文案**：列表項由 `N min read` 改為 `N min`（右側對齊）
- **列表項灰線裝飾**：標題下方、tag chip 右側追加一條 **gray progress meter**（純視覺，寬度可固定或依 reading time 比例）
- **Pinned 卡片**：補上 `date + title + meter lines + read →` CTA 結構（單篇放大顯示，非清單）
- **Archive 區塊**：由「逐年列出每篇文章」改為 **inline 年份計數**（`2026 (12)  2025 (10)  2024 (8)`）
- **RSS 路徑文案**：顯示文字由 `rss · /rss.xml` 改為 `rss · /feed.xml`（實際路由仍指向同一端點，僅顯示文字更新；若 RSS 路由尚未存在，作為後續 change 處理）
- **RSS icon**：在 `rss · /feed.xml` 文字前加上 `@lucide/vue` 的 `Rss` icon（14px、`stroke-width=2`、`currentColor`），提升辨識度
- **Tag filter chip 尺寸**：font `12px` + `leading-none` + `px-[14px]` + `py-[4px]`（總高 22px ≤ label box 22.5px，避免把 PageHeader 下緣的橫線推離既有頁面位置）
- **Reading time 解析修正**：`useReadingTime` 補上對 Nuxt Content v3 minimark AST 格式的解析（既有 helper 只支援舊版 hast / MDC，導致所有文章 `0 min`、meter 寬度 `0px`）

## Capabilities

### Modified Capabilities
- `blog-feature`：列表頁視覺規格更新，原本「list + pinned list + archive by year」改為「list with meter + pinned card + inline year archive」

### New Capabilities
（無）

## Impact

- **影響檔案**：
  - `app/pages/blog/index.vue`（視覺）
  - `app/composables/useReadingTime.ts`（minimark AST parser 修正，共用 helper）
  - `app/pages/blog/[slug].vue`（順手統一日期格式為 `YYYY · MM · DD`）
  - `package.json`（新增依賴 `@lucide/vue`）
- **依賴**：`add-blog-feature`（已 archive）；`add-design-tokens`、`add-shared-layout`（沿用 TagChip、PageHeader）
- **不影響**：`content/blog/*.md` 內容、tag filter 過濾邏輯
- **視覺測試**：`tests/blog.spec.ts` 既有 argos screenshot 會偵測到差異，需在 Argos 重新核准 baseline
