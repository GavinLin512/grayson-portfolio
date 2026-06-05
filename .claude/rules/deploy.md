# Deploy Rules

本文件記錄上線（部署到 Cloudflare Pages）前必須處理的「本機暫時設定 → 正式設定」切換項目。
本機開發為了能直接測試，常會用測試 / sandbox 值；這些值**不可帶上 production**。

---

## Contact Form（add-contact-form）

### 本機測試設定（暫時）

| 項目 | 本機值 | 原因 |
|------|--------|------|
| `server/utils/mail.ts` 的 `from` | `onboarding@resend.dev` | Resend 共用測試網域，免驗證即可寄信 |
| `.env` `NUXT_PUBLIC_CONTACT_EMAIL` | `gallerialin512@icloud.com` | `onboarding@resend.dev` 測試模式**只能寄到註冊 Resend 帳號的信箱** |
| `.env` Turnstile key | **Cloudflare 官方測試 key**（site `1x0000…AA`、secret `1x0000…AA`） | 正式 key 綁定 `grayson.cc` 網域，在 localhost 會「unable to connect」；測試 key 不限網域且永遠通過 |

### 上線前必做切換

- [ ] **驗證 `grayson.cc` 網域**：Resend → Domains → 加 `grayson.cc` → 把 Resend 給的 DNS records（TXT/MX）加進該網域的 DNS 提供商 → Verify
- [ ] **`mail.ts` 的 `from`** 換回 `contact@grayson.cc`（網域驗證通過後才可用）
- [ ] **`NUXT_PUBLIC_CONTACT_EMAIL`** 換成正式收件信箱（驗證網域後 Resend 才允許寄給任意收件人）
- [ ] **Cloudflare Pages → Settings → Environment Variables** 設定正式 secrets（變數名須與 `.env` 一致）：
  - `NUXT_PUBLIC_TURNSTILE_SITE_KEY`、`NUXT_TURNSTILE_SECRET_KEY`、`NUXT_RESEND_API_KEY`、`NUXT_PUBLIC_CONTACT_EMAIL`
  - 正式 Turnstile key 在 Cloudflare Turnstile 後台建立，網域設 `grayson.cc`
  - **Widget Mode 設「Invisible」**：`refine-contact-design` 後設計為隱形驗證（畫面只留「· protected by friendliness, not captcha」caption，無可見方塊）。render 用 `execution:'execute'`，挑戰延到**送出時**才跑——故載入畫面不會有 widget（即使本機測試 key 也一樣）；本機**按下送出後**才會看到測試 key 的「Verifying…」方塊，屬正常。
  - 不寫進 repo（依 `security.md` §4）
- [ ] **KV namespace**：`npx wrangler kv namespace create RATE_LIMIT`，把回傳 id 填入 `wrangler.toml`（注意是 `kv namespace`，不是舊語法 `kv:namespace`）

### 陷阱：runtimeConfig 的 `NUXT_PUBLIC_` 命名

`nuxt.config.ts` 的 `runtimeConfig.public.*` 對應的 env 變數**必須**加 `NUXT_PUBLIC_` 前綴，
否則對應不到、值為空字串（不會報錯，靜默失敗）。

| runtimeConfig key | 正確 env 變數名 |
|-------------------|----------------|
| `public.turnstileSiteKey` | `NUXT_PUBLIC_TURNSTILE_SITE_KEY` ✓（不是 `NUXT_TURNSTILE_SITE_KEY`）|
| `public.contactEmail` | `NUXT_PUBLIC_CONTACT_EMAIL` |
| `turnstileSecretKey`（非 public）| `NUXT_TURNSTILE_SECRET_KEY` |
| `resendApiKey`（非 public）| `NUXT_RESEND_API_KEY` |

> 症狀：site key 空 → Turnstile 渲染失敗 → token 空 → API zod 擋下回 400「Invalid request body」。

### 觀念備忘

- Resend 是**寄信服務**，不是收件匣；信最終寄到 `NUXT_PUBLIC_CONTACT_EMAIL`。
- 收件地址想用 `xxx@grayson.cc` 時，可另設 Cloudflare Email Routing 轉寄到實際信箱（非必要）。
- 本機 KV 不可用時 `checkRateLimit` 直接放行（rate limit 只在 Cloudflare 環境生效）。

### 驗證 rate limit（task 9.2）

`pnpm dev`（Nuxt 原生 server）沒有 KV，永遠放行，**測不出 429**。需用 wrangler + Miniflare 本地 KV：

```bash
pnpm build
npx wrangler pages dev dist --kv RATE_LIMIT --port 8788 --compatibility-date 2025-05-19
# 另開 terminal 連送 11 次（帶固定 CF-Connecting-IP），第 11 次應回 429
```

本地 env 由 `.dev.vars`（gitignored，格式同 `.env`）提供。測 rate limit 時可把 `NUXT_RESEND_API_KEY`
設成無效值，前 10 次會在寄信步驟回 502（rate limit 已先放行並計數），第 11 次回 429，即可零寄信驗證。
- Turnstile widget 用 `onMounted` 顯式 `render()`（非 auto-scan），避免 SPA hydration 時機錯過渲染。
