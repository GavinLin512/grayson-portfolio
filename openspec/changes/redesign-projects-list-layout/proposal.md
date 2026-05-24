## Why

目前 `/projects` 採用單欄全寬 list，與 `/uiux-fix/projects.png` 設計稿期望的「左 list + 右 preview」雙欄佈局不一致；同時 row 結構欠缺 year、category 兩個關鍵掃讀欄位，subtitle 過長、缺少 paper 暖色背景與 filter 互動，整體閱讀層級與設計稿落差大。本 change 重整 list 視覺與資訊架構，preview 區先做容器與 hover 行為 placeholder（圖像之後再放）。

## What Changes

- **BREAKING**：`/projects` list 改為雙欄 split layout（左 list ≈60% + 右 preview panel ≈40%）
- Header 重排：左 `— 02 / projects · N selected`；右側新增 filter tabs（`all` / `product` / `system` / `side`）
- List row 由 4 欄改為 5 欄：`index` / `year` / `title+subtitle` / `category` / `hover state`
- 標題改為大字 serif（≈32px）；subtitle 改為帶 `—` 前綴的精簡短描述
- Row hover：整列米色高亮，並更新右側 preview panel 內容
- 移除 list row 上的 stack chips（移到右側 preview panel）
- 移除 list row 末端的 `→` arrow（改由整列 hover 表達互動）
- 新增 frontmatter 欄位 `category`（值：`product` / `system` / `side` / `identity`）
- 重寫所有 `content/projects/*.md` 的 `subtitle` 為帶 `—` 的短描述
- 內容由 2 項擴充為 6 項（codename：Field / Hina / Kata / Mori / Foglight / Hako）
- 頁面背景改為 paper 暖色調（沿用 `--paper` token，無新增）
- Preview panel 結構（圖像之後再補）：標題 `preview · hover` + 45° 斜線紋路 placeholder + 中央 `NN - Title` 標籤 + 描述文字 + tech tag pills

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `projects-feature`：list 路由的視覺與資訊結構改為 split layout、5 欄 row、新增 category 欄位與 filter；preview panel 為佔位容器（圖像之後再放）

## Impact

- 修改檔案：`app/pages/projects/index.vue`、`content/projects/01-field.md`、`content/projects/02-hina.md`、`content.config.ts`（schema 新增 `category`）
- 新增檔案：`content/projects/03-kata.md`、`04-mori.md`、`05-foglight.md`、`06-hako.md`
- 不影響：`/projects/[slug]` detail page、既有 frontmatter 欄位（title / year / role / team / stack / cover / screens / date）
- 路由：仍維持 `/projects` SSG prerender
