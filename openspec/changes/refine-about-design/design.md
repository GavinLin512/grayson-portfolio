## Context

About 頁面 v1 完成後對照 `uiux-fix/about.png` 才發現 spec 是 *先寫文字後出設計*，導致 v1 實作（完成型彩色幾何頭像 + 長段 prose + Download CV 按鈕）與設計稿（wireframe 風頭像 + 2×2 snapshot grid + 無顯眼 CTA）的設計語言不一致。本 change 對齊兩者。

## Goals / Non-Goals

**Goals:**
- 嚴格對齊設計稿視覺結構與美學語彙
- 維持站點整體設計系統一致（編號標籤、Mincho headline、mono body、Caveat hand caption、米色底）
- 釐清 About snapshot 與 `/journey` timeline 的職責邊界

**Non-Goals:**
- 真實頭像照片（仍使用 placeholder；設計稿明確選擇 wireframe 美學）
- 互動微動畫（保持頁面靜態與印刷感）
- i18n / 多語切換

## Decisions

### 1. 頭像：HatchPortrait 而非 GeoPortrait

**Rationale**: 設計稿選擇「誠實展示未完成」而非「假裝完成」。彩色幾何頭像會讀作 *finished art piece*；對角線 hatch + 中央 label box 會讀作 *editorial placeholder*。後者更符合 portfolio 的工程師敘事（在意 craft、不偽裝、保留升級空間）。

**Implementation**:
```
<HatchPortrait label="portrait" :size="320" />
```
- 方形 (320×320 desktop / 240×240 mobile)
- 1px solid var(--line) 外框
- 內部 `repeating-linear-gradient(45deg, transparent, transparent 6px, var(--line) 6px, var(--line) 7px)` 對角線
- 中央 absolute 置中的 label box：~70×40px、border 1px ink、font-mono text-[11px]、背景 var(--bg)

未來換成真照片時：保留 component 形狀，把內部換成 `<img>`，外部 layout 不需動。

### 2. Snapshot Grid 而非 Career Timeline

**Conflict with prior spec**: add-about-page 明確禁止 now/previously/elsewhere（理由：歸屬 `/journey`）。本 change 撤銷該禁令。

**Rationale**:
- *Snapshot* ≠ *Timeline*：snapshot 是「我現在處於什麼狀態」的單行剪影，timeline 是「依時序列出每個職涯節點」的長表
- 設計稿用 4 個 lowercase 標籤（`now` / `previously` / `elsewhere` / `away from screens`）強調這是 *狀態*：
  - `previously` 不是完整時序，是一兩個關鍵 reference
  - `elsewhere` 是聯絡管道與外部 profile
  - `away from screens` 是個人興趣，與 timeline 完全無關
- 兩個頁面職責不衝突：About 給訪客「他是誰」的 30 秒印象；`/journey` 給深度讀者「完整職涯」的 5 分鐘閱讀

### 3. Measure Bars 而非 Prose

**Rationale**: Prose 段落會把右欄轉成 *閱讀區*，但 About 的目的是 *識別* 而非 *閱讀*。Measure bars 提供視覺節奏，類似編輯雜誌的 rule lines 或 print sketch 的 measurement marks。它們 *暗示* 結構與精確，卻不要求讀者解碼。

**Spec**:
- 2 行 horizontal bars
- 共 5 條：row 1 三條 (40% / 30% / 20%)；row 2 兩條 (35% / 30%)
- 高度 14px、gap 6px（橫向）/ 10px（縱向）
- 背景 var(--line) 或 ink @ 0.18 opacity
- 位於 headline 與 snapshot grid 之間

### 4. Download CV 降級為一行 link

**Rationale**:
- 設計稿無顯眼 CTA — 與整體克制基調一致
- 但 `/resume.pdf` 仍應可達（spec 仍要求 PDF 存在）
- 將 download link 放入 `elsewhere` snapshot：「cv · /resume.pdf」
- 這同時把 CV 重新定位為「也是聯絡管道之一」而非「主要 conversion goal」

### 5. Page Label「— 06 / about」

**Rationale**: Index 頁有 `N° 2026 — 04`，hero 區也有 `— 01 / hello.` pattern。About 加「— 06 / about」維持站點編號系統的視覺一致。

**Position**: 左上角，`absolute left-[60px] top-[40px]` 或在 wrapper 內 `font-mono text-[14px] opacity-60`。

## Risks / Trade-offs

- **風險**：HatchPortrait 過於 wireframe 會被誤讀為「未完成的頁面」
  - **緩解**：中央 label box 與整體 craftsmanship（精確的編號、measure bars、字型階層）建立「這是 *選擇* 而非 *遺漏*」的視覺訊號
- **權衡**：移除 prose 段落減少「個性表達」的長度
  - **接受**：個性透過 *選擇* 而非 *敘述* 傳達；2×2 snapshot 的具體 reference（「writing a small book on grids」「brewing tea」）已足以傳達 voice
- **權衡**：Archive 後再 modify 多一個 PR
  - **接受**：保留 v1 → v2 的 design pivot 軌跡，未來看 git history 能還原決策
- **影響**：Argos visual baseline 會大幅改變
  - **預期**：本 change 預設會出 visual diff，CI 上 Argos 需手動 approve 新 baseline
