## Why

首頁 Hero A 是 portfolio 對外的第一印象，也是 MVP 第一個可展示的頁面。承載「Grayson's Portfolio.」品牌大標與日系米色 + φ 幾何的視覺核心。

## What Changes

- 新增 `app/pages/index.vue` 使用 `default` layout
- PhiLines 渲染：
  - 主水平線 `y=38.2%`（width: 1）
  - 頂部 echo 線 `y=23.6%`（width: 0.5, opacity: 0.55）
  - 垂直 whisper 線 `x=61.8%`（width: 0.5）
  - cool 圓點落在 `(61.8%, 38.2%)`
- 左上 note：`— 01 / hello.\nportfolio of grayson`
- 左中 label：`N° 2026 — 04`
- 左下 `<TickWall :count="5" :length="56" :gap="16" />`
- 右下大標：hero-sub + hero-big（`text-[144px] leading-[0.95] font-mincho font-extrabold`）+ hero-byline
- 響應式：mobile（`<lg`）隱藏左側裝飾、大標縮 `text-[64px]`；tablet 大標 `text-[96px]`

## Capabilities

### New Capabilities
- `hero-page`：portfolio 首頁 Hero A 版型，含 φ 線、大標、TickWall 裝飾

### Modified Capabilities
（無）

## Impact

- 新增檔案：`app/pages/index.vue`
- 依賴：`add-shared-layout`（使用 SiteHeader、SiteFooter、TickWall、PhiLines）
- 路由：`/` SSG prerender
