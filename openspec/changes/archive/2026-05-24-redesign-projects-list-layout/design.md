## Context

`add-projects-feature` 完成的 `/projects` 採單欄全寬 list，但設計稿（`/uiux-fix/projects.png`）採雙欄 split 並使用 5 欄 row 結構、單一 category 標籤、右側 preview panel。視覺與資訊層級差距大，需重整。

本 change 只負責 list 路由的視覺重整與資料模型擴充（`category` 欄位、subtitle 文案重寫、6 個項目），preview panel 圖像之後再放，先做 placeholder 容器與 hover 行為。

## Goals / Non-Goals

**Goals:**
- `/projects` 改為左 list（≈60%）+ 右 preview panel（≈40%）的 split layout
- Row 結構：`index` / `year` / `title+subtitle` / `category` / `hover state`
- Header 右側 filter tabs：`all` / `product` / `system` / `side`
- Frontmatter 新增 `category` 欄位
- subtitle 全部改為 `— xxx` 短描述
- Hover row 米色高亮 + 即時更新右側 preview panel 內容
- 補滿 6 個項目（Field / Hina / Kata / Mori / Foglight / Hako）

**Non-Goals:**
- `/projects/[slug]` detail page 不動
- Preview panel 不放真實圖片（先用 45° 斜線紋路 placeholder）
- Filter tabs **僅做客戶端 reactive filtering**，不做 URL 同步 / 路由 query string
- 不引入新的 CSS framework；沿用既有 Tailwind + `--paper`/`--ink`/`--line`/`--cool` tokens
- 不變更既有 frontmatter 欄位（title / subtitle / year / role / team / stack / cover / screens / date 保留）

## Decisions

- **`category` 為 enum**（`product` / `system` / `side` / `identity`）而非自由字串：可預期的視覺對齊，未來方便做 filter group / 計數
  - Rationale：設計稿 header filter 是固定 4 個 tab，自由字串會破壞對齊
  - Alternative：tag 陣列（多分類）— 拒絕，與設計稿單一 tag 不符
- **Preview panel 圖像延後**：僅做容器 + 中央 `NN - Title` 文字 + 斜線紋路 placeholder
  - Rationale：避免本 change 範圍膨脹到要產生 / 採購 6 張 cover；UI 容器已可驗收
  - Alternative：直接用 `frontmatter.cover` — 拒絕，未確認所有 cover 圖已備齊
- **Hover 狀態用 client-side `ref<selectedIndex>`**：mouseenter 設值，preview panel 隨 selected 切換；mouseleave 不重設（最後 hover 的內容會留著）
  - Rationale：對齊設計稿 `preview · hover` 標題語意；mouseleave 重設會讓 preview 變空
  - Alternative：mouseleave 重設 → 拒絕，會閃爍
- **Filter tabs 為純 client reactive，不改路由**：點 tab 只切換 `activeCategory` ref；`all` 顯示全部
  - Rationale：MVP 不需要可分享 URL；後續若要再加 query string 容易
  - Alternative：用 `useRoute` + query → 拒絕，超出本 change 範圍
- **list row 不再有 `→` arrow / stack chips**：整列 hover 即代表互動；stack 移到 preview panel
  - Rationale：對齊設計稿，並避免欄位擁擠
- **頁面背景沿用既有 `--paper` token**：不新增色票，僅在 `/projects` 容器設定 `bg-[var(--paper)]`
- **新增的 4 個 markdown 檔（Kata / Mori / Foglight / Hako）內文先用 placeholder**：本 change 不要求完整 case study；只確保 frontmatter 與 list 顯示正確
  - Rationale：detail page 完整內容不在 scope，避免 change 過大
  - Alternative：補完 6 篇完整內容 → 拒絕，超出 list 重整 scope

## Risks / Trade-offs

- **Risk**：移除 list 上的 stack chips 後，未 hover 時看不到技術棧 → **Mitigation**：preview panel 永遠顯示一個項目（預設第一個或最後 hover 的項目）的 stack pills
- **Risk**：mouseleave 不重設可能讓使用者困惑哪個是「目前焦點」→ **Mitigation**：被 hover/selected 的 row 維持米色高亮直到下次 hover
- **Trade-off**：行動裝置可能不適合 split layout（觸控無 hover）→ **Mitigation**：本 change 先用 `lg:` breakpoint，未達 lg 維持單欄無 preview panel；行動互動正式設計留待後續
- **Risk**：新增 4 個 markdown 檔 detail page 內容不完整，點進去會看到 placeholder → **Mitigation**：在 markdown 內文標註 `> WIP — full case study coming.`，並在 task 紀錄此為已知限制
- **Risk**：`content.config.ts` schema 加入 `category` 後，既有 2 個 md 檔若未補欄位會 build fail → **Mitigation**：tasks 中明確要求同步補上 01-field / 02-hina 的 `category`
