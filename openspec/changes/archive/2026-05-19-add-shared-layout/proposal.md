## Why

所有頁面共用 SiteHeader（56px 頂部導覽）與 SiteFooter（36px 底部資訊），以及多個裝飾元件（TickWall、TagChip、GeoPortrait）。這些必須在第一個頁面 change 之前完成，否則每個頁面都要重複實作 chrome。

## What Changes

- 新增 `app/components/SiteHeader.vue`：56px 高、左 ◇ mark + date label、中 7 項導覽、右 EN pill + theme toggle
- 新增 `app/components/SiteFooter.vue`：36px 高、版權 + slogan + scroll 提示
- 新增 `app/components/TickWall.vue`：接受 `count`、`length`、`gap` props，渲染 N 條短橫線
- 新增 `app/components/TagChip.vue`：border 1px ink + border-radius 100px 的 chip 樣式，支援 `active` 狀態反白
- 新增 `app/components/GeoPortrait.vue`：用 `--cool` + `--bg` 矩形拼貼的幾何頭像（About 頁面使用）
- 新增 `app/layouts/default.vue`：SiteHeader + `<slot />` + SiteFooter
- 新增 `app/pages/playground.vue`：展示所有共用元件作為視覺對照

## Capabilities

### New Capabilities
- `shared-layout`：提供全站共用的 header、footer、layout 包裝、裝飾元件集

### Modified Capabilities
（無）

## Impact

- 新增 6 個 Vue components + 1 個 layout + 1 個 playground page
- 依賴：`add-phi-geometry-system`（SiteHeader/Footer 可能用到 PhiLines）
- 後續所有頁面 change 都使用 `default` layout 與共用元件
