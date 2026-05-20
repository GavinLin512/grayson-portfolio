## Context

Hero 是全站入口，預計在 1280px+ 桌面以「一屏無 scrollbar」的方式呈現。目前的字級和佈局都是開發初期快速定稿的值，尚未針對實際渲染做可讀性調整。

## Goals / Non-Goals

**Goals:**
- 消除 Hero 頁面縱向 scrollbar，確保上下左右均不溢出
- 提升 nav、footer、輔助文字的可讀性（最小 14px）
- 保持 Mincho 大標不變，維持原有視覺比例感

**Non-Goals:**
- 變更字型家族或 color tokens
- 調整響應式 breakpoint 邏輯
- 修改 header / footer 的高度（`h-14` / `h-9` 保持不變）

## Decisions

- **+4px 規則統一調升**：所有小字一律 +4px 而非逐一重訂，確保整體節奏一致，避免出現多種相近字級。
- **`h-screen overflow-hidden` + `overflow-y-auto` on main**：外層鎖死 viewport 高度並隱藏溢出；`<main>` 保留 `overflow-y-auto`，讓內頁（about、blog 等）仍能正常捲動，不影響未來功能。
- **Hero 改用 `h-full`**：Hero 本身不需要知道 header/footer 高度，只要填滿 flex parent 即可，解耦乾淨。
- **TagChip 跟進調整**：TagChip 同時用於 header 的 `EN` pill 和 theme toggle，字級維持與 nav 一致的 `14px` 有助視覺統一。

## Risks / Trade-offs

- **Trade-off**：`overflow-hidden` 鎖定在外層 wrapper，若未來有頁面需要 `position: sticky` 橫跨 header，可能需要調整層級。目前無此使用情境，可接受。
- **Risk**：TagChip pill 在 `14px` 下寬度增加，header 右側三件（EN pill、theme pill、nav）可能在窄桌面（1024px）出現擠壓。需在 Task 9 目測確認。
