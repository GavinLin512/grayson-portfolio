## Why

Career Journey 獨立路由承擔職涯時序（與 About 頁的個人介紹分工）。垂直履歷側欄版型左 sidebar 年份索引、右事件時序，配中央 φ 主軸。

## What Changes

- 建立 `content/timeline.yml`：每筆含 `year / yearEnd? / company / role / description / tags`
- 新增 `app/pages/journey.vue` 使用 `content` layout（同 about / skills）
- 左欄：垂直時間軸，年份 inline 顯示於各 entry（格式 `2024 → 25`），左側 φ spine（`border-l`）
- 右欄：résumé · cv 卡片（靜態，含 PDF 下載與 preview 按鈕）
- `scroll-behavior: smooth` 加入全域 `html` CSS
- 各 entry 有 `id="year-{year}"` 供 anchor 連結

## Capabilities

### New Capabilities
- `journey-timeline`：垂直履歷側欄職涯時序頁面

### Modified Capabilities
（無）

## Impact

- 新增檔案：`app/pages/journey.vue`、`content/timeline.yml`
- 依賴：`add-shared-layout`（使用 TagChip）
- 路由：`/journey` SSG prerender
