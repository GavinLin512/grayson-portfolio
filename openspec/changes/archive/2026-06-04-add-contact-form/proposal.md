## Why

聯絡表單是 portfolio 標配。需要 Resend 寄信、Turnstile 防垃圾、KV rate limit 防濫用。本地 dev 用 Cloudflare 公開測試 key，正式 key 由 CF Pages Dashboard 注入。

## What Changes

- 安裝 `@cloudflare/turnstile` widget
- 新增 `app/pages/contact.vue`：ContactSplit 版型（左聯絡資訊 + 右表單）
  - input：`h-[38px] border border-ink bg-paper mt-[6px]`
  - 嵌 Turnstile widget
  - submit 後顯示 Caveat 風格 success note
- 新增 `server/utils/mail.ts`：Resend API client（fetch 不裝 SDK 以減少 bundle）
- 新增 `server/utils/ratelimit.ts`：KV 實作（10 req/小時/IP，IP 來自 `cf-connecting-ip` header）
- 新增 `server/api/contact.post.ts`：驗 Turnstile → 驗 rate limit → 寄信 → 回 200
- `.env.example` 加入 `NUXT_TURNSTILE_SITE_KEY`、`NUXT_TURNSTILE_SECRET_KEY`、`NUXT_RESEND_API_KEY`、`NUXT_PUBLIC_CONTACT_EMAIL`
- `.env` 本地用 Cloudflare 公開測試 key：site `1x00000000000000000000AA`、secret `1x0000000000000000000000000000000AA`
- `nuxt.config.ts` 加 `runtimeConfig` 讀環境變數
- `routeRules: { '/contact': { ssr: true } }`

## Capabilities

### New Capabilities
- `contact-form`：聯絡表單頁面 + 後端寄信 API + Turnstile 防垃圾 + KV rate limit

### Modified Capabilities
（無）

## Impact

- 新增檔案：`app/pages/contact.vue`、`server/api/contact.post.ts`、`server/utils/mail.ts`、`server/utils/ratelimit.ts`
- 修改檔案：`nuxt.config.ts`、`.env.example`
- 依賴：`add-shared-layout`
- 外部服務：Resend（免費 3000 封/月）、Cloudflare Turnstile、Cloudflare KV
