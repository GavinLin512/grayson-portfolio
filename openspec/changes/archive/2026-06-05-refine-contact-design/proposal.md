## Why

目前 `/contact` 頁面只有「左欄聯絡資訊 + 右欄表單」的素樸版型，與設計稿 `uiux-fix/contact.png` 落差明顯：缺少左欄的 serif 大標與導言、聯絡資訊未對齊、表單沒有訊息分類（topic）選擇器，且送出按鈕樣式與配置都與設計不符。這次調整讓 contact 頁的視覺密度與排版與既有頁面（about / projects / blog）一致，並補上設計稿的關鍵元素。

## What Changes

- 左欄新增 `font-mincho` 大標「say hello, / or send a postcard.」、`font-mono` 導言「i answer within a few days. for work, tell me the shape of the problem.」與分隔線。
- 左欄聯絡資訊改為「label 左 / value 右對齊」列表；新增 `read.cv → /grayson` 列；`location` 改為 `taipei · GMT+8`。
- 表單新增「what kind of message?」topic pill 選擇器（`work` / `hello` / `speaking` / `other`，`work` 預設選取、實心 ink 樣式），選取值併入 `POST /api/contact` 的 request body。
- `message` textarea 加高，吃滿右欄剩餘高度。
- Turnstile 改為不可見驗證，移除可見 widget，改以「· protected by friendliness, not captcha」caption 取代。
- 送出按鈕改為實心黑、右下對齊，文字由「send message →」改為「send →」。

純前端視覺 refine：寄信、rate-limit、Turnstile 驗證等後端邏輯不變，僅在 zod schema 與信件內容補上新的 `topic` 欄位。

## Capabilities

### New Capabilities
<!-- 無新增 capability -->

### Modified Capabilities
- `contact-form`: 兩欄版型新增左欄 hero 區塊與對齊式聯絡資訊；表單新增 topic 欄位並併入提交 body 與信件內容；Turnstile 由可見 widget 改為不可見驗證（caption 取代）；送出按鈕樣式/位置/文案調整。

## Impact

- `app/pages/contact.vue`：左欄、表單、按鈕、裝飾線版型重寫（純前端）。
- `server/api/contact.post.ts`：zod schema 與信件內容新增 `topic` 欄位（後端邏輯其餘不變）。
- `tests/`：contact Argos 截圖的 mask 目標由 Turnstile widget 改為新的不可見驗證 / caption（依 `.claude/rules/CI.md` mask 規則）。
- 須符合 `.claude/rules/frontend.md` 滿版規範（root `h-full flex flex-col`，主內容區塊 `flex-1`）。
