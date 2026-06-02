## Why

Career Journey 獨立路由承擔職涯時序（與 About 頁的個人介紹分工）。垂直履歷側欄版型左 sidebar 年份索引、右事件時序，配中央 φ 主軸。

## What Changes

- 建立 `content/timeline.yml`：陣列每筆含 `year / company / role / description / tags`
- 新增 `app/pages/journey.vue` 使用 `default` layout
- 左 sidebar（`w-[180px]`）：年份索引列表 + 總數
- 中央垂直 φ 主軸：`x=38.2%`、`height:100%`、`border-l 1px ink`
- 右主欄：v-for 事件，每筆 year label → `<h3 class="font-mincho">{company} · {role}</h3>` → `<p class="font-mono">{description}</p>` → chips
- sidebar 年份點擊滾動到對應事件（`scroll-behavior: smooth`）

## Capabilities

### New Capabilities
- `journey-timeline`：垂直履歷側欄職涯時序頁面

### Modified Capabilities
（無）

## Impact

- 新增檔案：`app/pages/journey.vue`、`content/timeline.yml`
- 依賴：`add-shared-layout`（使用 TagChip）
- 路由：`/journey` SSG prerender
