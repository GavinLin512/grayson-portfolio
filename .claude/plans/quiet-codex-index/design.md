# Design — index.vue Quiet Codex 重設計

> 依據 `.claude/plans/quiet-codex-ui-design-system.md`（中古手抄本 × 日系靜謐簡約）重排首頁 Hero。
> 範圍：僅 `app/pages/index.vue`，外加兩行純新增的 token（`--gold`）。

---

## Context

原首頁以 PhiLines（黃金比例幾何線）主導構圖，標題錨在右下角、字重 extrabold、最大 144px，
偏「幾何 / 編號系統」氣質。Quiet Codex 方向要求書頁感、留白、克制的裝飾，因此整體改為
「手抄本書頁」的編排隱喻。

## 保留與移除

| 元素 | 處置 |
|------|------|
| PhiLines | **自首頁移除**。元件本身保留（`app/pages/playground.vue` 仍使用）|
| marginalia（— 01 / hello…）| 保留，維持左緣旁註位置（手抄本 marginal note）|
| N° 2026 — 04 | 保留，移到右上角，扮演古籍 folio（頁碼）|
| TickWall | 保留，左下角 tally marks |
| 標題區塊 | 保留內容，改為置中閱讀欄（見下）|

## Layout 決策

- **680px 閱讀欄置中**（plan §3 content width）：標題區從右下角錨定改為
  `flex items-center` + `max-w-[680px] mx-auto`，像一頁書的正文欄。
  marginalia 與 TickWall 留在左緣、folio 在右上，構成不對稱的書頁邊註結構。
- **字級降階**：144/96/64 → `text-64 md:text-96`；字重 extrabold → semibold（Shippori Mincho 600 已載入）。
  安靜感來自留白與較輕的字重，而非尺寸壓迫。
- **裝飾克制**（plan §4）：標題上方 56px 短橫線、標題下方「橫線 ❦ 橫線」分隔、
  手抄本頁框（見下節）。裝飾線一律 2px（`border-t-2`，opacity .4–.5）——
  原 hairline 版本在羊皮紙底上太弱，後調粗。
- **植物線稿（已移除）**：原右下角鋼筆線稿枝條（plan §6，後曾放大至 112px、
  `--herb` 上色並加五顆漿果）已整枝移除，右下角改由全域調色盤的收合 trigger 進駐
  （見「鋼筆游標與繪畫系統」）——右下角只留一個元素、不與頁框角飾打架；
  `--herb` token 保留，仍是墨水色之一。
- **紙張質感**（plan §5）：feTurbulence noise data-URI 一層，opacity 0.05，幾乎不可見。

## 封面式點綴（參考 `uiux-fix/index/` 截圖）

參考圖為銅版蝕刻風漫畫封面（金色 filigree 框、菱形飾、卷數 cartouche、
退色藍綠 × 金 × 羊皮紙配色）。轉化為以下克制的點綴，皆為桌機（lg+）限定：

- **手抄本頁框**：`inset-[24px]` 1.5px 框（ink，opacity .4），
  四角疊上 72px 蝕刻風角飾 SVG（同一 SVG 旋轉四次）：雙框線（圓角轉角，ink）+
  兩道同心弧線橫跨頂線與側線之間（gold）、弧帶內排線（cross-hatch）與越過外弧的
  短刻線（ink，仿銅版雕刻筆觸）、內袋卷曲螺線 + 對葉（gold）、內弧與框線交點各一枚
  金色 lozenge。全部曲線構成，無直角圖騰（依參考截圖風格但去直角化）。
  左右框線中點與底線中點各一枚 10px 金色菱形。
- **Folio cartouche**：`N° 2026 — 04` 移到頁框頂線正中，`bg-bg` 遮住背後框線、
  兩側各一枚 7px 金色菱形——如封面上的卷數標示。小螢幕退回右上角純文字（無框）。
- **星芒星場**：8 顆四芒星線稿散布全頁（9–20px，script `stars` 陣列配置位置 /
  尺寸 / 延遲 / 週期），`--gold`；各自以 4.2–6s ease-in-out 閃爍（.1 ↔ .9，
  高對比 twinkle），小星以較粗 stroke（`sw`）補償 viewBox 縮放。
  位置避開置中閱讀欄與左緣旁註；基底 opacity .45，
  Argos 取消 infinite 動畫後回落此值，截圖仍確定。
- ~~植物線稿上色~~：`--herb` 上色 + 彩色漿果的版本已隨植物整枝移除
  （見上方 Layout 決策），`--herb`（light `#6a745e` / dark `#8c9681`）留作墨水色。

## Color / 對比

- 沿用既有 `--bg / --ink / --line` token（已是羊皮紙 × 墨色系，與 plan 色向一致），不動全站色票。
- **新增 `--gold`**（tokens.css 純新增兩行 + tailwind `gold`）：light `#8c7853`、dark `#a08f73`
  （plan「Muted Gold」），僅用於 ❦ 裝飾符號。
- **對比度**：文字一律走 `--ink`；輔助文字最低 opacity 0.7（原 N° 為 0.55，已提高）。
  0.7 × ink 疊在兩種模式的 `--bg` 上約 5.5:1 以上；opacity ≤ 0.55 只用於純裝飾線條
  （裝飾線 .4–.55，角飾內排線最低 .35）。

## Motion（plan §8「動畫像空氣流動」）

- 進場：`qc-fade`（opacity + 10px 上移，0.9s ease，`--d` 逐項延遲 0 → 0.7s），
  終點 opacity 由 `--o` 控制（因 keyframe `to` 會覆寫 utility class 的 opacity，故不用 `opacity-*` class）。
- 植物線稿 `qc-draw`：stroke-dashoffset 1 → 0（`pathLength="1"`），1.6s，逐 path 延遲。
- `prefers-reduced-motion: reduce` 時全部動畫停用、直接呈現終態。
- 所有動畫皆有限且 `forwards`，Argos（`animations: disabled`）截圖時直接跳到終態，結果確定性不變。

## 首頁動態層（鋼筆線條 × 靜謐奇幻）

依動態示意稿（https://claude.ai/code/artifact/050a353a-ca8d-4840-a2af-4f916c7fa28a）選定五項 + 標題描字，全部 lg+ 限定、皆走 `prefers-reduced-motion` 停用並呈現終態：

| 效果 | 實作 | 時序 |
|------|------|------|
| 標題筆跡描字 | `<h1>` 內 SVG `<text>`（`qc-glyphs`，Shippori Mincho 600、96 units、`paint-order: stroke`），每字一個 `<tspan>` 帶 `--d`（0.13s 一字、左上→右下）：先 dash 描出字形輪廓 0.55s，0.45s 後墨色（fill-opacity）滲入 | 一次性，約 4s |
| 藤蔓沿底框生長 | `qc-vine` SVG（`left-74 bottom-26`、420×80，避開 TickWall 與底線中點菱形）；莖為 Catmull-Rom 過 8 點，**純數學取樣弧長**（無 `getPointAtLength`，SSR 可渲染），葉片每 46px 一片、依莖進度延遲舒展，末端兩顆金色漿果 | 一次性，0.5s 起 4.4s |
| 星盤緩轉 | `qc-astro` 640px 髮絲線星盤置於閱讀欄後方，外環 240s/圈、rete 反向 160s，整體 opacity .75 | 持續 |
| 書庫光塵 + 流星筆痕 | 同一 `<canvas>`（`startAtmosphere`）：46 粒微塵上浮明滅；每 6–12s 一顆四芒星自右上劃過、拖髮絲墨線。webdriver / reduce-motion / <lg 不啟動；每 90 幀重讀 `--ink / --gold` 以跟隨 dark mode | 持續 |
| 燭光呼吸 | `qc-candle` 底緣 radial-gradient（`color-mix` gold 22%）7s 呼吸，❦ 同步 | 持續 |

**與開場動畫的銜接**：描字與藤蔓的 CSS animation 一律 `paused` 出廠（SSR 時標題空白、無閃爍），
root 加上 `.qc-play` 才 running。`play` 在開場排線 `done()` 時、或無開場（已看過 / webdriver / reduce-motion）時於 mounted 立即設為 true。
**Argos**：webdriver 下 canvas 不啟動，其餘為 CSS animation，`animations: disabled` 直接落在終態（排版標題、長好的藤蔓、靜止星盤），已以 Playwright 驗證確定。

## 鋼筆游標與繪畫系統（全域，`InkPen.vue` + `PenGlyph.vue`）

原本 index 專屬的「筆尖游標」已升級為**全站系統**，掛在 `app.vue`（單一實例、
跨頁導航不重掛，筆跡因此跨頁保留）。桌機（`pointer: fine`）才啟用；
touch 裝置完全不啟動、保留原生操作。

| 部件 | 行為 |
|------|------|
| 整隻鋼筆游標 | `PenGlyph.vue`（深色雪茄筆身 + 筆夾 + 握位環 + 葉形筆尖含筆縫/通氣孔，45° 持筆角），筆尖對齊指標、依水平速度微傾（±10°）；筆尖染上目前選色。全站 `cursor: none`，但 `input / textarea / select` 例外（顯示原生 caret、鋼筆隱藏） |
| 暫時墨痕 | hover 移動畫在 trail canvas，寬 1.8–6.8px，1.8s 淡出。渲染為**漸細墨帶**（共邊 butt-joint 四邊形填色，非 round-cap 線段——半透明圓帽疊加會浮出一顆顆圓點、不像筆跡）：寬度隨墨齡收細（尾端「乾掉」）、前端收尖如出墨，並以筆向對 45° 筆尖的夾角調變粗細（義大利體式 thick/thin） |
| 按住繪畫 | pointerdown 拖曳 >4px 即開始**永久筆畫**（寬 2.4–7.5px、速度越慢越粗），與暫時墨痕共用同一套墨帶渲染（`fillRibbon`，45° 筆尖 thick/thin），起筆 / 收筆皆於最後幾個取樣點內**收尖**（筆尖落紙 / 提筆）；等透明度筆畫以單一封閉輪廓**一次 fill**（分段填色會在共邊留下抗鋸齒細縫痕）。進行中畫在 trail 層即時預覽、pointerup 才一次寫入 perm canvas，跨頁保留（「畫在玻璃上」：fixed canvas，不隨內容捲動） |
| 墨漬 | 原地點擊（未拖曳）才產生淡出墨漬；互動元素（連結、按鈕、表單）上的點擊不畫 |
| 調色盤 | 右下角 fixed 收合圓鈕 48px（`right-[60px] bottom-[112px]`、`z-90`，modal `z-100` 之下；位置避開 index 頁框 24px inset + 72px 角飾）：畫家調色盤 icon，盤上一枚大 dab 即時顯示目前選色。hover / focus-within 時，五色 swatch 24px（`--ink / --cool / --warm / --herb / --gold`）+ ✕ 清除 28px 沿**四分之一圓弧扇形展開**（正上 → 正左，R 84px，逐項 35ms stagger），如調色盤上的顏料點；指標離開即收回。`::before` 隱形 halo（僅左上象限矩形）維持指標跨越空隙時的 hover 不斷線；`isInteractive` 加入 `.ink-palette`，在 halo 上按下不會起筆。滑鼠點擊 swatch / trigger 後主動 `blur()`（`e.detail` 區分，鍵盤啟動不 blur）——否則 `:focus-within` 會把扇形釘在展開態、hover 離開收不回來 |

實作要點：

- **兩層 canvas**：trail 層每幀清除重畫（暫時墨痕 + 進行中筆畫的即時預覽）；
  永久層只在筆畫完成（pointerup）時被寫入一次、不每幀重畫；
  resize / 切換 dark mode 時由筆畫資料重建永久層。
- 筆畫存 token 名而非色值；`MutationObserver` 監看 `<html>` class，切 dark mode 時清 cache 重畫 → 永久筆跡即時換色、兩種模式對比都正確。
- 事件掛 window（pointermove/down/up/cancel + blur + dragstart 防拖圖），互動元素以 `closest('a, button, …')` 排除起筆。
- 繪畫進行中對 `<html>` 加 `ink-noselect`（user-select none），拖曳不會同時選字；代價是滑鼠拖曳選取文字改為畫圖（雙擊選字仍可用）。
- z 層：perm `z-80` → trail `z-81` → palette `z-90` → SearchModal `z-100` → 鋼筆 `z-110`。
- **Argos 影響**：調色盤收合 trigger 會出現在所有頁面截圖右下角（扇形只在 hover 展開，截圖恆為收合態）→ 全站 baseline 需重新核准一次；筆跡只由指標驅動，不影響截圖確定性。

## 首次載入繪製動畫（index）— 排線式（hatching）

第一次進站（sessionStorage `qc-intro` 無值）時播放「把整頁畫出來」開場，約 **3 秒**：

- 一層 `bg-bg` 的 fixed overlay（`z-95`，蓋住 header/footer），顯示前緣為對角線
  x + y = k，由左上緩慢掃到右下（easeInOutSine，k: 0 → 2.05）。
- 一隻 110px 的 `PenGlyph` 沿著**當下前緣線段**（視窗內的截段：左下端 ↔ 右上端）
  來回移動 7 個半程，如同鋼筆排線（hatching）上陰影；尾段 12% 淡出。
- **JS rAF 驅動**（非 CSS keyframes）：clip-path 與筆位置每幀由同一個 k 計算，
  完全同步；線段端點 A=(max(0,k−1), min(k,1))、B=(min(k,1), max(0,k−1))，
  筆位置 = lerp(A, B, 三角波(t·7))。
- overlay SSR 即渲染為可見（server/client 一致，無 hydration 閃爍）；mounted 時
  已看過、reduce-motion、或 **`navigator.webdriver`（Argos/Playwright 自動化）**
  → 直接隱藏。JS 動畫無法被 Playwright 的 animations:disabled 快轉，
  故以 webdriver 偵測跳過，保住截圖確定性。

## 驗證紀錄

- Playwright 截圖驗證：light / dark / mobile（390px）三態版面正常、無 console error；
  模擬滑鼠曲線移動 + 點擊，筆跡與墨漬如預期渲染並淡出。
- dark mode 標題與輔助文字對比充足（cream on `#1a1815`）。
- 點綴追加後重新驗證 light / dark / mobile 與局部放大截圖：頁框、角飾、cartouche、
  菱形、星芒、漿果皆正常，mobile 不受影響（頁框與 cartouche 為 lg+ 限定）。
- 點綴強化（星場 8 顆 + 高對比 twinkle、72px 蝕刻角飾、植物 112px + 五漿果彈出、
  菱形 / 邊線加粗）後重新驗證 light / dark / mobile + 角飾局部截圖：
  版面正常、無 console error，mobile 不受影響（皆 lg+ 限定）。
- 調色盤改版驗證（植物移除、收合 trigger + hover 弧形展開；二修：左移至
  right-60、trigger 48px / swatch 24px / R 84 放大、點擊後 blur 修 focus-within
  卡展開）：收合態不擋角飾、hover 扇形展開、展開中點選 indigo 後畫線顏色正確、
  點擊後指標離開仍自動收合、trigger dab 即時變色——全數通過，無 console error。
- 筆跡渲染改版驗證（拖行 + 永久筆跡改墨帶）：慢速橢圓有明顯 thick/thin、
  快速直線兩端收尖、無圓點串珠也無分段接縫痕；dark mode 由 redrawPerm 重建後
  筆跡正常換色——無 console error。
- 全域鋼筆系統驗證：開場繪製動畫（筆尖騎在對角顯示邊界上）、整隻筆游標、
  按住繪畫（黑 + 靛藍兩筆）、跨頁至 /about 筆跡保留、dark mode 筆跡即時換色、
  清除全部、同 session 重載不重播開場——全數通過，無 console error。

## 星圖版（取代前文的「手抄本頁框」「星芒星場」「星盤」描述）

三個候選版本（燭照 / 栞 / 星圖）中選定「星圖」轉正，並併入「燭照」版的框線描繪。
現行頁面以此節為準：

| 項目 | 現況 |
|------|------|
| 頁框四角 | 由蝕刻花飾改為**四分之一星盤刻度弧**：以框角為圓心的兩道弧（r70 / r61），每 5° 一刻度、15° 長刻度、45° 處一枚金色菱形。極細線、無直角圖騰，ornament 較前版更克制 |
| 框線 | 8 段（每邊兩半）自四角往中點長出（0.9s → 3.3s），中點菱形與頂部 cartouche 於會合時淡入；刻度弧逐筆描出（stroke-dash，依 `--i` 錯開）。全部 authored paused，`.qc-play` 釋放；reduced-motion 直接呈終態 |
| 度數刻度 | 四邊內側各一條刻度尺（每 10px 短刻、每 50px 長刻），兩端以 mask 淡出，框線到位後（2.8s）淡入，opacity .32 |
| 星場 | 9 顆（新增 22% / 50% 一顆），座標改為頁面百分比的**中心點**，供星座線共用 |
| 星座連線 | canvas 依序把星芒連成 lyra / corvus / cygnus，細虛線（0.7px、`[3,5]`）以 smoothstep 逐段畫出（每段 2.2s）→ 停留 5s → 淡出 3s，組間隔 5–10s；首組等 5s（讓開場先結束）。畫完於首星旁以 mono 10px 金色寫上名稱。lg+ 限定 |
| 星盤 | 外環**靜止**，rete 仍以 160s 反向緩轉；新增**時針**（髮絲線 + 金色菱形）指向真實時刻，client 端於開始播放後以 3.2s 緩動轉到位、每分鐘更新；SSR 固定 XII |
| 光塵 / 流星 | 光塵維持 46 顆；流星保留 |

**Argos 確定性**：`navigator.webdriver` 下時針凍結在 XII、星座改為單次 0.18 alpha 靜態繪製、光塵 / 流星 / 開場略過
（理由見 `decisions.md`）。模擬 Argos 條件（webdriver = true、`animations: 'disabled'`）連拍三張，hash 相同。
首頁截圖 baseline 因設計改版需重新核准一次。

驗證：亮 / 暗、reduced-motion、390px、`/` ⇄ `/about` 站內導覽（標題完整描完、開場遮罩不殘留）皆通過，無 console error 與 hydration 警告。
