## Why

`uiux-fix/about.png` 是 About 頁面確定版設計稿。當前實作（add-about-page）成品與設計稿在 *結構* 與 *美學語彙* 上有實質落差：

1. **頭像視覺策略不同**：設計稿故意把頭像呈現為 hatch 對角線 placeholder + 中央「portrait」label，是「誠實展示未完成」的編輯式 wireframe 取向；現有 `<GeoPortrait>` 已是完成感較高的彩色幾何構圖，破壞了設計稿想要的克制感。
2. **內容組織完全不同**：設計稿用 2×2 snapshot grid（`now` / `previously` / `elsewhere` / `away from screens`）取代長段 prose 與顯眼的 Download CV 按鈕；snapshot 是「狀態快照」而非「履歷時序」，與 `/journey` 不衝突。
3. **缺少編輯框架元素**：頁面編號標籤「— 06 / about」、headline 下的 measure bars decoration、Caveat 推到左欄底部的 spatial rhythm，這些都是設計語言一致性的關鍵。

## What Changes

- **REMOVE** 對角 `<PhiLines>` 背景線
- **REPLACE** `<GeoPortrait>` 為新元件 `<HatchPortrait>`（方形 wireframe placeholder：對角線陰影 + 中央「portrait」label box）
- **REMOVE** 4 段 mono prose 段落
- **REMOVE** 顯眼的 Download CV 框線按鈕（移至 elsewhere snapshot 內成為一行 link）
- **ADD** 頁面編號標籤「— 06 / about」（左上角，沿用 hero 頁同樣的 `N° / section` pattern）
- **ADD** Headline 下方 measure bars decoration（2 行、共 5 條不等寬橫條，opacity ~0.2）
- **ADD** 2×2 snapshot grid：
  - `now` — lead frontend at hina · writing a small book on grids
  - `previously` — field llc · hatch · mori · taught a tiny class on css
  - `elsewhere` — github · @grayson, read.cv · /grayson, email · hi@grayson.cc, cv · /resume.pdf
  - `away from screens` — brewing tea, walking long routes, collecting small ceramic things
- **MOVE** Caveat caption 至左欄**底部**（與頂部頭像 column-justify 對齊），由原本緊貼頭像下方改為填滿欄高的下緣
- **REVISE** Spec：`About page SHALL NOT include now/previously sections` → 改為 snapshot grid 必要 requirement；釐清 snapshot 與 `/journey` timeline 的職責邊界

## Capabilities

### Modified Capabilities
- `about-page`：頭像策略、內容組織、版面結構全面重寫

## Impact

- **新增檔案**：`app/components/HatchPortrait.vue`
- **修改檔案**：`app/pages/about.vue`（基本重寫）
- **移除元件依賴**：`<GeoPortrait>` 不再在 about 頁使用（保留元件供其他頁面使用）
- **不影響**：`/resume.pdf` 仍存在、`routeRules`、`default` layout、Argos baseline 需重新核准
