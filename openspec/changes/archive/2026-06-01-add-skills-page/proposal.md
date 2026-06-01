## Why

Skills 頁面用 4 欄分類展示技術能力。純內容頁面，可快速完成，作為個人能力總覽。

## What Changes

- 建立 `content/skills.yml`：backend / frontend / devops / database 4 個 key，各為字串陣列
- 新增 `app/pages/skills.vue` 使用 `default` layout
- `queryContent('skills').findOne()` 讀取 YAML
- `grid grid-cols-4 gap-12` 4 欄
- 每欄：類別 label → chip cluster（v-for 用 `<TagChip>`）→ 一行 Caveat 手寫註解
- 一條對角 φ 線背景（opacity 0.45）
- 響應式：tablet 2 欄、mobile 單欄

## Capabilities

### New Capabilities
- `skills-page`：4 欄分類的技術能力總覽頁

### Modified Capabilities
（無）

## Impact

- 新增檔案：`app/pages/skills.vue`、`content/skills.yml`
- 依賴：`add-shared-layout`（使用 TagChip、PhiLines）
- 路由：`/skills` SSG prerender
