## 1. Environment Variables

- [x] 1.1 Append to `.env.example`:
  ```
  NUXT_TURNSTILE_SITE_KEY=1x00000000000000000000AA
  NUXT_TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
  NUXT_RESEND_API_KEY=re_xxxx
  NUXT_PUBLIC_CONTACT_EMAIL=your@email.com
  ```
- [x] 1.2 Create local `.env` with the same test keys (will be gitignored)

## 2. Runtime Config

- [x] 2.1 In `nuxt.config.ts`, add `runtimeConfig`:
  ```ts
  runtimeConfig: {
    turnstileSecretKey: '',  // from NUXT_TURNSTILE_SECRET_KEY
    resendApiKey: '',         // from NUXT_RESEND_API_KEY
    public: {
      turnstileSiteKey: '',   // from NUXT_TURNSTILE_SITE_KEY
      contactEmail: '',        // from NUXT_PUBLIC_CONTACT_EMAIL
    },
  }
  ```
- [x] 2.2 Add to `routeRules`: `/contact: { ssr: true }`

## 3. Turnstile Widget

- [x] 3.1 Run `pnpm add @cloudflare/turnstile` (or use plain script tag from `https://challenges.cloudflare.com/turnstile/v0/api.js`)
- [x] 3.2 Decide on plugin approach: client-side plugin loads the script in `app.vue` head

## 4. Contact Page

- [x] 4.1 Create `app/pages/contact.vue` (uses `default` layout)
- [x] 4.2 Two-column grid: `grid grid-cols-1 lg:grid-cols-2 gap-[80px]`
- [x] 4.3 Left column: contact info entries (email / GitHub / location) each as `<div>` with label + value
- [x] 4.4 Right column: form with fields:
  - `<input name="name" required>`
  - `<input name="email" type="email" required>`
  - `<textarea name="message" required rows="6">`
  - Turnstile widget `<div class="cf-turnstile" :data-sitekey="config.public.turnstileSiteKey">`
  - submit button (TagChip-styled)
- [x] 4.5 Inputs styled: `h-[38px] border border-ink bg-paper mt-[6px] px-3 font-mono text-[12px]` (textarea uses `min-h-[120px]` instead)
- [x] 4.6 On submit: capture token from Turnstile via `turnstile.getResponse()`, POST `/api/contact`
- [x] 4.7 On 200 response: replace form with Caveat success note "— thanks. i'll write back soon."
- [x] 4.8 On error: show inline error message

## 5. Rate Limit Utility

- [x] 5.1 Create `server/utils/ratelimit.ts`
- [x] 5.2 Export `async function checkRateLimit(event, key, max, windowSeconds): Promise<boolean>` that:
  - Gets IP from `getRequestHeader(event, 'cf-connecting-ip')` (or fallback)
  - Hashes IP+salt with `SubtleCrypto.digest('SHA-256', ...)`
  - Reads counter from KV (`env.RATE_LIMIT.get(hashKey)`)
  - If count >= max return false; else increment with TTL

## 6. Mail Utility

- [x] 6.1 Create `server/utils/mail.ts`
- [x] 6.2 Export `async function sendContactEmail(payload, apiKey, toEmail)` that calls Resend API:
  ```ts
  fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: \`Bearer \${apiKey}\` }, body: JSON.stringify({...}) })
  ```

## 7. Contact API Route

- [x] 7.1 Create `server/api/contact.post.ts`
- [x] 7.2 Read body, validate fields
- [x] 7.3 Verify Turnstile: POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with token + secret
- [x] 7.4 If verification fails: return 403
- [x] 7.5 Check rate limit via `checkRateLimit(event, 'contact', 10, 3600)`
- [x] 7.6 If exceeded: return 429
- [x] 7.7 Send email via `sendContactEmail()`
- [x] 7.8 Return 200 on success

## 8. wrangler.toml KV Binding

- [x] 8.1 Add KV binding to `wrangler.toml`:
  ```toml
  [[kv_namespaces]]
  binding = "RATE_LIMIT"
  id = "<created via npx wrangler kv:namespace create RATE_LIMIT>"
  ```

## 9. Verification

- [x] 9.1 `pnpm dev`: open `/contact`, send a test message → Resend dashboard shows it
- [x] 9.2 Submit 11 times rapidly: 11th request returns 429（用 `wrangler pages dev dist --kv RATE_LIMIT` 提供本地 KV 驗證；前 10 次 502、第 11 次 429）
- [x] 9.3 Submit with invalid Turnstile (manually break the token): returns 403
