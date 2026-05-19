## Why

黃金比例 φ ≈ 1.618 是整站視覺語言，所有頁面都會用到 φ 錨點的裝飾線條。需要一個共用 `PhiLines` 元件與 φ 常數 composable，避免每頁重複實作 SVG。元件需在 SSG 模式下正確渲染（不依賴 client-side 量測）。

## What Changes

- 新增 `app/composables/usePhi.ts`，匯出 `PHI_INV` 與 `PHI_INV2` 兩個常數
- 新增 `app/components/PhiLines.vue`：
  - 接受 `lines` 陣列（每筆含 `x1/y1/x2/y2/width?/opacity?`）
  - 選用 `dot` 物件渲染 cool 圓點
  - SVG 使用 `viewBox="0 0 100 100"` + `preserveAspectRatio="none"` 撐滿父容器
  - 座標可接受百分比字串（如 `'61.8%'`）或數字
- 在 `app/app.vue` 加 demo 區塊驗證線條落點正確

## Capabilities

### New Capabilities
- `phi-geometry`：提供 φ 黃金比例幾何裝飾線元件與常數，供所有頁面複用

### Modified Capabilities
（無）

## Impact

- 新增檔案：`app/composables/usePhi.ts`、`app/components/PhiLines.vue`
- 依賴：`add-design-tokens`（PhiLines 用 `var(--ink)`、`var(--cool)` 顏色）
- 後續所有頁面 change 都會 import `<PhiLines>`
