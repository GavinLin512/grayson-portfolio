## 1. 頁面容器修正

- [x] 1.1 移除 `app/pages/projects/index.vue` 頁面根元素上的 `bg-[var(--paper)]` class，使背景透明繼承 layout `--bg`
- [x] 1.2 將根元素 `min-h-screen` 改為 `h-full`，並確保根元素有 `flex flex-col` 以支撐子元素撐滿高度
- [x] 1.3 確認根元素保留 `overflow-hidden`（或改 `overflow-x-hidden`）防止水平溢出

## 2. 列表欄位 overflow 修正

- [x] 2.1 左欄 list 容器（`<div>` wrapping `NuxtLink`）加入 `overflow-y-auto`，使列表在高度不足時於欄位內捲動
- [x] 2.2 確認 Two-column grid 容器有 `overflow-hidden` 及 `flex-1`，撐滿父容器剩餘高度

## 3. Row hover 動畫修正

- [x] 3.1 移除 `NuxtLink` 上的 `:class` 條件切換（`bg-[#f0e9d8]` / `hover:bg-[#f0e9d8]`）
- [x] 3.2 改以 `:style="{ backgroundColor: selectedProject?._path === project._path ? 'var(--paper)' : '' }"` 設定背景
- [x] 3.3 確認 `NuxtLink` 有 `transition-[background-color] duration-200 ease-in-out` class
- [x] 3.4 移除 `NuxtLink` 上多餘的 `block` class

## 4. Verification

- [x] 4.1 `pnpm dev`：`/projects` 在桌面寬度下，頁面與 header 背景色一致，無 scrollbar
- [x] 4.2 Hover 任一列：背景色從透明平滑過渡至淡色，200ms 動畫可見
- [x] 4.3 切換 hover 至另一列：上一列背景平滑消退，新列背景浮現
- [x] 4.4 `pnpm build`：build 成功，無新的 warning 或 error
