## Why

`redesign-projects-list-layout` 實作後，`/projects` 頁面出現三個視覺 / 互動問題：背景色與 layout 不一致、頁面高度超出可視區造成不必要的 scrollbar、以及 list row 的 hover 背景轉場失效。這些問題直接影響觀感與互動品質，需在進行下一個 change 前修正。

## What Changes

- **FIX** `app/pages/projects/index.vue`：移除 `bg-[var(--paper)]`，頁面背景改為透明，沿用 layout 的 `--bg` token，消除顏色不一致
- **FIX** 頁面容器由 `min-h-screen` 改為 `h-full flex flex-col`，讓頁面高度受限於 `main`（`flex-1 overflow-y-auto`），不再溢出
- **FIX** list row hover 動畫：移除 `:class` 在 `bg-[#f0e9d8]` / `hover:bg-[#f0e9d8]` 之間切換的方式，改以 `:style` 直接設定 `background-color` CSS property，搭配 `transition-[background-color] duration-200`，確保 Vue 響應式更新也能觸發 CSS transition
- **FIX** 移除 NuxtLink 上多餘的 `block` class（與 `grid` 衝突）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `projects-feature`：list 路由的版面高度行為、背景色語意、row hover 動畫機制改變

## Impact

- 修改檔案：`app/pages/projects/index.vue`（僅此一檔）
- 不影響：content schema、frontmatter、detail page、filter 邏輯、preview panel 結構
