## Why

About 頁面承擔個人介紹與 Resume PDF 下載入口。職涯時序由 `/journey` 獨立路由負責，本頁聚焦在「我是誰」的單頁敘事。

## What Changes

- 新增 `app/pages/about.vue` 使用 `default` layout
- 一條對角 φ 線背景（從 `y1=38.2%` 到 `y2=18%`、opacity 0.55）
- 左欄：`<GeoPortrait />`（400×460）+ 下方 Caveat 手寫 caption「— grayson, somewhere in taipei.」
- 右欄：`font-mincho text-[42px] leading-[1.15]` 大標 + 數行 `font-mono` 段落
- 底部 Resume 下載按鈕：`<a href="/resume.pdf">` border 1px ink 樣式
- 放置 `public/resume.pdf`（placeholder 1px PDF 或實際履歷）
- 響應式：mobile 改單欄、portrait 縮 60% 寬
- **不包含 now/previously 區塊**（由 `/journey` 承擔）

## Capabilities

### New Capabilities
- `about-page`：portfolio 自介頁面，含幾何頭像、Mincho 大標、Resume 下載

### Modified Capabilities
（無）

## Impact

- 新增檔案：`app/pages/about.vue`、`public/resume.pdf`
- 依賴：`add-shared-layout`（使用 GeoPortrait、PhiLines）
- 路由：`/about` SSG prerender
