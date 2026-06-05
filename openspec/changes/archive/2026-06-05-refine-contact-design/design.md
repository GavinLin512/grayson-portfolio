## Context

`/contact` 已上線（archive `add-contact-form`），但版型停在功能最小版：左欄三列堆疊聯絡資訊、右欄 name/email/message + 可見 Turnstile widget + 外框送出鈕。設計稿 `uiux-fix/contact.png` 要求更接近 about / projects 的 editorial 密度：左欄 serif 大標 + 導言 + 對齊聯絡資訊，右欄加入 topic 分類、加高 message、不可見驗證與右下實心送出鈕。

約束：

- 字體 token 已存在於 `tailwind.config.ts`：serif=`font-mincho`、mono=`font-mono`、hand=`font-hand`。沿用，不新增字體。
- 滿版規範（`.claude/rules/frontend.md`）：root `relative h-full flex flex-col`，主內容區塊 `flex-1`，1280×800 下底部不得留白。
- Argos 視覺測試（`.claude/rules/CI.md`）：非確定性區塊須以穩定 class 供 `mask` 使用，並用 `min-h` 佔固定空間避免 layout shift。
- 後端寄信 / rate-limit / Turnstile 驗證邏輯維持不變（`server/api/contact.post.ts`、`server/utils/mail.ts`）。

## Goals / Non-Goals

**Goals:**

- 左欄補上 hero（大標 + 導言 + 分隔線）與對齊式聯絡資訊（含 `read.cv`、`taipei · GMT+8`）。
- 表單新增 topic 分類選擇器，選取值併入提交 body 與信件內容。
- message 區加高吃滿剩餘高度；送出鈕改實心黑、右下對齊、文案「send →」。
- Turnstile 改不可見驗證，以 caption 取代可見 widget。

**Non-Goals:**

- 不改寄信流程、Resend 串接、rate-limit、KV 邏輯。
- 不改 `/contact` 的 SSR routeRule。
- 不新增字體或設計 token。
- 不調整 SiteHeader / SiteFooter。
- 不加入設計稿中那條淡斜線（判定為輔助參考線/截圖殘留，非設計元素）。

## Decisions

### 1. 左欄版型：hero block + 對齊式聯絡資訊

`font-mincho` 大標兩行（約 `text-[40px]`，對齊 about.vue 的 42px 量級），下接 `font-mono` 導言，再接 `border-t border-line` 分隔線，最後是聯絡資訊列表。每列以 `flex justify-between` 達成「label 左 / value 右對齊」。聯絡資訊維持 `font-mono text-[12px]`。email 值優先沿用 `config.public.contactEmail`（環境驅動），其餘 `github` / `read.cv` / `location` 為靜態值。

**為何**：與 about.vue 的 `font-mincho` 大標 + `font-mono` 細節一致，重用既有視覺語言，不引入新樣式。

### 2. topic 選擇器：受控 pill 群組

以 `ref<Topic>('work')` 管理選取狀態，`work | hello | speaking | other`。pill 樣式：選取=實心 `bg-ink text-bg`、未選取=外框 `border border-ink`。選取值放入 `form.topic`，提交時併入 `POST /api/contact` body。

後端 `server/api/contact.post.ts` 的 zod schema 補 `topic: z.enum(['work','hello','speaking','other'])`，並把 topic 帶進信件主旨／內容。schema 失敗仍回 400（沿用既有行為）。

**替代方案**：用 `<select>`。否決——設計稿是 pill 群組，且 pill 與站內 mono 風格更一致。

### 3. Turnstile 不可見驗證 + caption

改用 Turnstile invisible 模式（隱形與否由 dashboard sitekey 型別決定，**非** render 參數；官方 `size` 只有 `normal|flexible|compact`，無 `invisible`），移除可見 widget 方塊，改放 caption「· protected by friendliness, not captcha」。

**為何**：設計稿不顯示 captcha；不可見模式保留驗證但符合視覺。

**render 設定（依官方文件）**：

- script 載入 `?render=explicit&onload=onTurnstileLoad`，由 onload 回呼觸發 `render()`（取代 setInterval 輪詢）；SPA 回訪時 `window.turnstile` 已存在則直接 render。
- render 選項 `execution: 'execute'` + `appearance: 'execute'`：挑戰延到 submit 時 `turnstile.execute()` 才跑，token 一律新鮮（只活 300s），也不對每個訪客都驗。
- 加 `timeout-callback` 一併清空 token。
- 後端 siteverify 帶 `remoteip`（`cf-connecting-ip`）交叉比對。

**隱形模式的 UX（避免按了沒反應）**：

- **按下立即進 loading**：`handleSubmit` 一開始就 `loading = true`，按鈕即時改字，不等驗證完才反應。
- **分階段標示**：token 未就緒顯示 `verifying...`，token 到手顯示 `sending...`，讓使用者知道卡在驗證還是寄信。
- **execute-on-submit + 等待**：原本「沒 token 直接報錯」改為 `ensureToken()`——有 fresh token 直接用；沒有則 `turnstile.execute()` 主動觸發隱形驗證，並把該次 submit 的 resolver 暫存，待 widget callback 回 token 後續送。
- **timeout 上限（12s）**：驗證真的卡住時 reject `verify-timeout`，回明確訊息可重試，永不無限轉圈。
- token 過期（`expired-callback`）會清空 token，下次 submit 走 `execute()` 重驗。

**Argos 影響**：caption 為靜態文字可確定；invisible widget 一般不佔版面，但挑戰彈出時可能注入 iframe，故保留穩定 class `.cf-turnstile-box` 作為 mask 目標（沿用既有測試的 mask，無需改測試）。

### 4. 送出鈕 + caption 同一基線

底部以 `flex items-center justify-between` 排版：左為 caption，右為送出鈕。送出鈕 `bg-ink text-bg`、`font-mono text-[12px]`、文案 `send →`（送出中 `sending...`）。

### 5. 滿版 flex chain

root `relative h-full flex flex-col` → `PageHeader` → `flex-1 grid lg:grid-cols-2`。右欄自身 `flex flex-col h-full`，message 區塊 `flex-1` 吃滿剩餘高度，底部 caption+button row `shrink-0`，確保 1280×800 無底部留白。

## Risks / Trade-offs

- [topic 欄位讓 schema 變嚴格，舊 client 不帶 topic 會被 400 擋下] → 同次 PR 前後端一起改；front 永遠帶預設 `work`，不存在無 topic 的合法請求。
- [不可見 Turnstile 在某些情境需互動挑戰，無可見容器可能導致 UX 卡住] → 保留 caption 旁的 fallback 容器（隱形但可被 widget 撐開），互動挑戰出現時仍可顯示。
- [Argos baseline 因版型大改會整片 diff，需人工重新核准] → 預期內；合併 `dev` 後更新 baseline，PR 比對下一版。
