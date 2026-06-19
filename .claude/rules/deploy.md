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
| `.env` Turnstile key | **Cloudflare 官方測試 key**（site `1x0000…AA`、secret `1x0000…AA`） | 正式 key 綁定 `grayson512portfolio.dpdns.org` 網域，在 localhost 會「unable to connect」；測試 key 不限網域且永遠通過 |

### 上線前必做切換

- [ ] **驗證 `grayson512portfolio.dpdns.org` 網域**：Resend → Domains → 加 `grayson512portfolio.dpdns.org` → 把 Resend 給的 DNS records（TXT/MX）加進該網域的 DNS 提供商 → Verify
- [ ] **`mail.ts` 的 `from`** 換回 `contact@grayson512portfolio.dpdns.org`（網域驗證通過後才可用）
- [ ] **`NUXT_PUBLIC_CONTACT_EMAIL`** 換成正式收件信箱（驗證網域後 Resend 才允許寄給任意收件人）
- [ ] **Cloudflare Pages → Settings → Environment Variables** 設定正式 secrets（變數名須與 `.env` 一致）：
  - `NUXT_PUBLIC_TURNSTILE_SITE_KEY`、`NUXT_TURNSTILE_SECRET_KEY`、`NUXT_RESEND_API_KEY`、`NUXT_PUBLIC_CONTACT_EMAIL`
  - 正式 Turnstile key 在 Cloudflare Turnstile 後台建立，網域設 `grayson512portfolio.dpdns.org`
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
- 收件地址想用 `xxx@grayson512portfolio.dpdns.org` 時，可另設 Cloudflare Email Routing 轉寄到實際信箱（非必要）。
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

---

## Site Search（add-site-search）

### 上線前必做

- [ ] **Cloudflare Pages → Settings → Build command** 設為 `pnpm build`（`build` script 已串 `nuxt build && pagefind --site dist`，**不要**另外加 pagefind 步驟）。
- 搜尋索引需要 blog/project 詳細頁是靜態 HTML：`nuxt.config.ts` 已設 `nitro.prerender.crawlLinks: true` 讓 prerender 跟著列表頁連結爬出所有詳細頁；少了這行只會索引到 6 個列表頁。
- **`/pagefind/*` 必須在 `dist/_routes.json` 的 exclude**：pagefind 在 `nuxt build` 之後才產生這些檔 → 不在 exclude 內 → Cloudflare Pages（與本機 `wrangler pages dev`）會把 `/pagefind/*` 路由給 Nitro worker → 404 → 搜尋載入失敗。已在 `nuxt.config.ts` 設 `nitro.cloudflare.pages.routes.exclude: ['/pagefind/*']` 解決（此設定會與 Nitro 自動產生的 exclude **合併**，不必手動維護其餘項目）。
- 驗證：`pnpm build` 後 `dist/pagefind/pagefind.js` 應存在，`dist/_routes.json` 的 exclude 應含 `/pagefind/*`，pagefind log 顯示已索引 16 頁。
- 本機要看效果用 `npx wrangler pages dev dist`（**改 `_routes.json` 後需重啟** wrangler 才生效）；純靜態 server（如 `python -m http.server`）不讀 `_routes.json`，所以本來就能載入 pagefind。
- 本機 `pnpm dev` 無索引（`/pagefind/pagefind.js` 404），SearchModal 顯示「Search index not built」屬正常。

---

## Node 版本（Cloudflare Pages build）

**不需要設 `NODE_VERSION`。** Cloudflare Pages 目前的 v3 build system 預設就是 **Node 22**（依官方文件），與本專案需求相符。

- 所以 task 4.6 的 `NODE_VERSION=22` 可略過，也**不需** `.node-version` / `.nvmrc` 檔。
- 僅在「想鎖更高版本」或「未來預設變動想固定」時，才於 repo 根目錄放 `.node-version`（內容如 `22`）顯式指定——此檔是 build-time 設定，須進 git 才會被讀到。

---

## Secret vs Vars（環境變數設定）

Cloudflare Pages 的設定值分兩類，處理方式不同：

| 類型 | 範例 | 放哪裡 | 進 git？ | 生效方式 |
|------|------|--------|----------|----------|
| **Secret（機密）** | `NUXT_RESEND_API_KEY`、`NUXT_TURNSTILE_SECRET_KEY`、`NUXT_OAUTH_GITHUB_CLIENT_SECRET`、`NUXT_SESSION_PASSWORD` | Dashboard → Settings → Environment Variables（值設為 encrypt、**設定後不可見**），或 CLI `wrangler pages secret put` | **否** | **需重新 deploy 才生效**（不會套用到既有 deployment）|
| **Vars（公開、非機密）** | `NUXT_PUBLIC_CONTACT_EMAIL`、`NUXT_PUBLIC_TURNSTILE_SITE_KEY`、`NUXT_SITE_URL`、`NUXT_SITE_NAME` | `wrangler.toml` 的 `[vars]` | **是** | deploy 時自動帶入 |

重點：

- **Secret 絕不寫進 `wrangler.toml` / 任何進 git 的檔**（明文外洩，違反 security.md §4）。
- Secret 在 Dashboard 設定值後就**看不到原值**，只能覆寫；要改值就重設一次。
- 設 / 改 secret 後**一定要重新 deploy**（push 觸發 build，或 `wrangler pages deploy dist`），舊 deployment 不會自動吃到新值。
- 程式讀取見 `.claude/docs/decisions.md`：CF runtime 沒有 `process.env`，server 端須 `useRuntimeConfig(event)`（**帶 event**）才讀得到。
