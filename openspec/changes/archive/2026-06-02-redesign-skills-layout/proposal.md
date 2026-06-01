## Why

設計稿 `uiux-fix/skills.png` 與現有 `app/pages/skills.vue` 差異過大，已不是微調而是版面重構：

- 技能從「圓角 chip 群集」改為「逐列 row + 5 格熟練度方塊 + 虛線分隔」
- 分類從 backend/frontend/devops/database 改為**編號式** languages/frameworks/craft/tools
- 四欄改為**錯落（staggered）構圖**，各欄標題線高度不一
- 底部由「每欄一句 Caveat」改為兩組註解：`currently learning` 與 `not interested in`
- Header 標籤由 `— 05 / skills` 改為 `— 05 / what i carry in the toolbox`

這同時推翻了 `add-skills-page` 原本兩個 Non-Goal（不做熟練度計量、固定 4 分類），需以新 change 修訂規格。

## What Changes

- **資料結構重構** `content/skills.yml`：由 4 個字串陣列改為 `categories` 陣列，每項含 `index`/`label`/`skills`（每技能 `{ name, level }`），並新增 `currentlyLearning`、`notInterested` 兩個字串欄位
- **schema 更新** `content.config.ts`：`skills` collection schema 改為新形狀
- **新元件** `app/components/SkillMeter.vue`：渲染 5 格方塊（filled / empty）表示 `level`（0–5）
- **重寫** `app/pages/skills.vue`：
  - Header label 改為 `— 05 / what i carry in the toolbox`
  - 四欄資料驅動（`v-for` over `categories`），不再寫死分類
  - 每欄：編號標籤 `0N / label` + 橫線 → 技能 row 清單（serif 名 + `<SkillMeter>`，列間虛線）
  - 欄位錯落：各欄套不同 `mt` 垂直偏移，重現設計稿波浪構圖
  - 底部兩組註解區塊（`currently learning` / `not interested in`，hand 字體）
- 移除 `TagChip` 在本頁的使用與每欄 Caveat

## Capabilities

### Modified Capabilities
- `skills-page`：由 chip 群集改為 row + 熟練度方塊的錯落四欄版面，分類與資料形狀重構

### New Capabilities
（無）

## Impact

- 修改檔案：`app/pages/skills.vue`、`content/skills.yml`、`content.config.ts`
- 新增檔案：`app/components/SkillMeter.vue`
- 視覺測試：`tests/` 的 skills 截圖 baseline 會變動，需重新核准 Argos
- 依賴：`add-skills-page`（本 change 取代其版面決策）
