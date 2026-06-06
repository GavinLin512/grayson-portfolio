## 1. 左欄 hero + 聯絡資訊

- [x] 1.1 在 `app/pages/contact.vue` 左欄加入 `font-mincho` 大標兩行「say hello, / or send a postcard.」
- [x] 1.2 大標下加入 `font-mono` 導言「i answer within a few days. for work, tell me the shape of the problem.」
- [x] 1.3 導言下加入 `border-t border-line` 分隔線
- [x] 1.4 聯絡資訊改為 `flex justify-between` 對齊列：`email`（沿用 `config.public.contactEmail`）/ `github → @grayson` / `read.cv → /grayson` / `location → taipei · GMT+8`

## 2. 表單 topic 選擇器

- [x] 2.1 加入 `ref<'work'|'hello'|'speaking'|'other'>('work')` 與 pill 群組（選取 `bg-ink text-bg`、未選取 `border border-ink`），標題「what kind of message?」
- [x] 2.2 將選取 topic 併入 `form` 並在 `handleSubmit` 的 `POST /api/contact` body 帶上 `topic`

## 3. message / 驗證 / 送出鈕版型

- [x] 3.1 右欄改 `flex flex-col h-full`，`message` textarea 包在 `flex-1` 區塊吃滿剩餘高度
- [x] 3.2 移除可見 Turnstile widget 方塊，改為 invisible 模式；render 目標保留穩定 class `.cf-turnstile-box`（無 `min-h`，隱形不佔版面）供 Argos mask
- [x] 3.3 底部 `flex items-center justify-between`：左 caption「· protected by friendliness, not captcha」，右送出鈕
- [x] 3.4 送出鈕改 `bg-ink text-bg` 實心、文案「send →」（驗證中「verifying...」、寄信中「sending...」）

## 4. 滿版檢查

- [x] 4.1 確認 root `relative h-full flex flex-col`、主內容 `flex-1`，1280×800 viewport 底部與 SiteFooter 間無留白

## 5. 後端 topic 欄位

- [x] 5.1 `server/api/contact.post.ts` zod schema 新增 `topic: z.enum(['work','hello','speaking','other'])`
- [x] 5.2 將 `topic` 帶進寄出信件的主旨／內容（`server/utils/mail.ts` 視需要調整）

## 6. 隱形驗證 UX 與 render 設定（依官方文件）

- [x] 6.1 script 改 `?render=explicit&onload=onTurnstileLoad`，以 onload 回呼觸發 `render()` 取代 setInterval 輪詢；SPA 回訪時 `window.turnstile` 已存在則直接 render
- [x] 6.2 render 選項 `execution:'execute'` + `appearance:'execute'`：挑戰延到 submit 時 `turnstile.execute()` 才跑（token 一律新鮮、不對每個訪客驗）；加 `timeout-callback` 清空 token
- [x] 6.3 `handleSubmit` 一開始即 `loading=true`（即時反饋）；`ensureToken()` 有 token 直接用、無則 `execute()` 等待，並設 12s timeout 回明確訊息
- [x] 6.4 後端 siteverify body 帶 `remoteip`（`cf-connecting-ip`）交叉比對

## 7. 測試與驗證

- [x] 7.1 Argos mask 目標沿用同一個 `.cf-turnstile-box` class，無須改 `tests/screenshot-pages.spec.ts`（依 `.claude/rules/CI.md`）
- [x] 7.2 本機 `pnpm dev` 目視比對 `uiux-fix/contact.png`：hero、對齊聯絡資訊、topic pill、加高 message、右下實心送出鈕
- [x] 7.3 送出一筆含 `topic` 的測試訊息，確認 API 回 200 且信件含 topic（依 `.claude/rules/deploy.md` 本機測試設定）
- [x] 7.4 Playwright（mock `/api/contact`）驗證：按下即 `verifying...`、POST body 含 `topic` 與非空 `turnstileToken`、成功訊息顯示、未實際寄信
