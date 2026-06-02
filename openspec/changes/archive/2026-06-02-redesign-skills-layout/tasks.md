## 1. Data & Schema

- [x] 1.1 重寫 `content/skills.yml` 為新形狀（`header` / `categories[]`（`index`/`label`/`skills[]{name,level}`）/ `currentlyLearning` / `notInterested`），數值對照 `uiux-fix/skills.png`
- [x] 1.2 更新 `content.config.ts` 的 `skills` collection schema 為新 `z.object`（含 `level` 0–5 驗證）

## 2. SkillMeter 元件

- [x] 2.1 新增 `app/components/SkillMeter.vue`：props `level: number`，渲染 5 格方塊（前 `level` 格 `bg-ink`，其餘 `border border-ink`），含 `aria-label`

## 3. 重寫 skills.vue

- [x] 3.1 root 維持 `relative h-full flex flex-col`（content layout 滿版規範）
- [x] 3.2 `<PageHeader label="— 05 / what i carry in the toolbox" />`
- [x] 3.3 背景 `<PhiLines>` 對角線沿用既有設定（必要時微調角度對齊設計稿）
- [x] 3.4 四欄 `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`，`v-for` over `skills.categories`
- [x] 3.5 每欄頂部：`{{ cat.index }} / {{ cat.label }}`（mono）+ `border-t border-line`
- [x] 3.6 每欄技能 row：serif 名 + `<SkillMeter :level>`，`flex justify-between`，列間 `border-b border-dotted border-line`
- [x] 3.7 錯落偏移：各欄 `lg:mt-*`（languages 0 / frameworks 10 / craft 3 / tools 6 起點），對照 `skills.png` 微調；`< lg` 取消偏移
- [x] 3.8 底部雙註解區塊（`currently learning` / `not interested in`，hand 字體），grid 對齊第 1、3 欄
- [x] 3.9 移除本頁 `TagChip` 與每欄 Caveat 舊邏輯

## 4. Verification

- [x] 4.1 `/skills` SSR HTML 含 4 個編號分類與每技能 5 格方塊（meter cells=100、dotted=20、無 TagChip）
- [x] 4.2 1280×800 viewport 下與 `uiux-fix/skills.png` 並排比對：錯落、虛線、雙註解一致
- [x] 4.3 底部與 SiteFooter 間無多餘空白（mt-auto 將雙註解推至底部，滿版）
- [x] 4.4 `md` 雙欄收斂正常，偏移取消（820px 截圖驗證）
- [x] 4.5 `pnpm build` 通過（schema 驗證無誤）
- [ ] 4.6 Argos：skills 截圖 baseline 變動，需於 CI（push/PR 後）人工重新核准 — 待 PR
