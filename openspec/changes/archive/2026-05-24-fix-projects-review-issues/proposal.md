## Why

PR review 發現 `add-projects-feature` 留下三個缺陷：潛在 null crash、CSS 背景色邏輯錯誤、以及 SQLite 快取檔被 commit 進版本控制。這三個問題需在合併前修正以確保可靠性與乾淨的 git 歷史。

## What Changes

- `app/pages/projects/index.vue` line 8：`projects.length` → `projects?.length ?? 0`，防止 `useAsyncData` 回傳 null 時拋出 TypeError
- `app/pages/projects/[slug].vue` lines 75-79：以 `<div class="bg-[var(--cool)]">` 包覆 `<img>`，使 cool 背景色在圖片正常載入時也能顯示
- `.gitignore`：新增 `.data/` 排除規則，防止 `@nuxt/content` 自動產生的 SQLite 快取（`.data/content/contents.sqlite`）被追蹤

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `projects-feature`：修正清單頁 null 安全性與詳情頁 cool 背景色渲染邏輯

## Impact

- 修改檔案：`app/pages/projects/index.vue`、`app/pages/projects/[slug].vue`、`.gitignore`
- 無 API、路由、或依賴變更
- `.data/content/contents.sqlite` 需從 git 版本控制中移除
