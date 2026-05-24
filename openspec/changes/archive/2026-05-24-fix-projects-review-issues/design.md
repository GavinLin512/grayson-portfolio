## Context

`add-projects-feature` PR review 發現三個缺陷：
1. `projects/index.vue` 對 `useAsyncData` 回傳的 `null` 無防護
2. `[slug].vue` 第二張截圖用 `<img>` 的 `bg-*` class，但背景色只在圖片載入失敗時才可見
3. `.data/` 目錄（`@nuxt/content` SQLite 快取）被納入版本控制

## Goals / Non-Goals

**Goals:**
- 修正 null-safe 問題
- 修正 cool 背景色的渲染邏輯
- 從 git 追蹤中排除 `.data/` 目錄

**Non-Goals:**
- 重構 stack chips 為 TagChip 元件
- 調整 projects 頁面任何其他視覺設計

## Decisions

- **`projects?.length ?? 0`**：Vue template 中 `data` ref 初始值為 `null`，optional chaining 是最輕量的修正方式，不需要引入額外 guard 邏輯。
- **`<div>` 容器包覆 `<img>`**：CSS `background-*` 屬性在 `<img>` 元素上僅作為 broken-image fallback；將背景色移至容器 `<div>` 是標準做法，圖片正常載入時背景仍可透過 object-fit 的空白區域顯示。
- **`.gitignore` 加 `.data/`**：加整個目錄而非只加 `*.sqlite`，因為 `@nuxt/content` 可能在該目錄產生其他快取檔。

## Risks / Trade-offs

- `.data/content/contents.sqlite` 已被 commit，需執行 `git rm --cached .data/content/contents.sqlite` 從 index 移除（不刪除本地檔案）。此為單次操作，不影響其他開發者的本地環境。
