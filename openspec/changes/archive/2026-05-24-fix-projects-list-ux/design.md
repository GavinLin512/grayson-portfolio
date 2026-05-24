## Context

`redesign-projects-list-layout` 完成後，`app/pages/projects/index.vue` 出現三個實作缺陷：

1. **背景色衝突**：頁面容器加了 `bg-[var(--paper)]`（`#f8f4ec`），但 `default.vue` layout 根元素是 `bg-bg`（`--bg: #efe6d4`）；header / footer 維持 `--bg`，頁面主體卻是偏白的 `--paper`，色塊拼接感明顯。
2. **多餘 scrollbar**：頁面容器用 `min-h-screen`，強制高度 ≥ 100vh；而 `main` 是 `flex-1 overflow-y-auto`，其實際高度 = `100vh − header(56px) − footer`。二者差距導致 `main` 觸發 scrollbar，即使內容本身可以在螢幕內呈現。
3. **hover 動畫失效**：以 `:class` 條件在 `bg-[#f0e9d8]`（靜態）與 `hover:bg-[#f0e9d8]`（CSS pseudo-class）之間切換，本質上是在切換兩條獨立 CSS rule，`transition-colors` 只能在同一個 property 的值改變時觸發，無法跨 rule 過渡。

## Goals / Non-Goals

**Goals:**
- 頁面背景透明（繼承 layout `--bg`），與 header/footer 視覺一致
- 頁面高度填滿 `main` 可用空間（`h-full`），不觸發外層 scrollbar
- left list 改為 `overflow-y-auto`（若列表超出高度才在左欄內部 scroll）
- row hover 使用 `:style` 直接設 `background-color: var(--paper)`，由 CSS `transition-[background-color]` 動畫
- selected row 持續顯示 `--paper` 背景（`mouseleave` 不重設）

**Non-Goals:**
- 不改動 layout `default.vue`（影響範圍太廣）
- 不改動 filter 邏輯、preview panel 結構、或 content schema
- 不新增 design token

## Decisions

- **頁面背景用透明而非 `bg-[var(--bg)]`**：直接不設 background，讓 layout 的 `--bg` 透出；語意更清晰，且未來 layout 改色時頁面自動跟隨。
  - Alternative：顯式寫 `bg-[var(--bg)]` → 拒絕，若 layout token 改名則要同步兩處。

- **`h-full flex flex-col` 取代 `min-h-screen`**：`main` 已是 `flex-1`，其子元素用 `h-full` 即可填滿，不會溢出。
  - Alternative：保留 `min-h-screen` 並在 `main` 加 `overflow-hidden` → 拒絕，影響所有頁面的 scroll 行為。

- **hover 背景用 `:style` binding 設 `background-color`**：Vue 響應式更新 inline style 時，`transition-[background-color]` 可正確觸發，因為改變的是同一個 CSS property 的值，而非 class 本身。選用 `var(--paper)` 作 hover 色：比 hardcode `#f0e9d8` 更能適應 dark mode（dark `--paper: #24211d` 在深色背景上同樣呈現對比）。
  - Alternative：用 CSS module 或 `<style scoped>` 寫 `.row--selected` → 拒絕，引入額外的 class binding，且要多一個 CSS rule 管理。

- **移除 NuxtLink 上的 `block` class**：NuxtLink 渲染為 `<a>`（inline），加 `grid` 即自動變 block-level grid container；多餘的 `block` 在 Tailwind 生成順序下可能與 `grid` 衝突，移除以減少不確定性。

## Risks / Trade-offs

- **Risk**：`h-full` 依賴 `main` 有具體高度；若未來 layout 改為非 flex-col 結構，`h-full` 會失效 → Mitigation：layout 目前是 `h-screen flex flex-col`，`flex-1` 保證 main 有計算高度，短期穩定。
- **Trade-off**：left list 加 `overflow-y-auto` 後，若專案數量少（≤ 6），根本不會 scroll，但預留了往後 content 增多時的安全邊際。
- **Trade-off**：hover 色 `var(--paper)` 在 light mode 下為 `#f8f4ec`（極淺，比頁面背景 `--bg: #efe6d4` 更白），對比差距約 15 RGB units；視覺上屬於微妙的「提亮」效果，與設計稿風格一致（低調 hover）。
