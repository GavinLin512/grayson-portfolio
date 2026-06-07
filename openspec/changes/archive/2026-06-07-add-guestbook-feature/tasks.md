## 1. Install nuxt-auth-utils

- [x] 1.1 Run `pnpm add nuxt-auth-utils`
- [x] 1.2 Add `'nuxt-auth-utils'` to `nuxt.config.ts` `modules`

## 2. GitHub OAuth App (Local)

- [x] 2.1 Visit https://github.com/settings/developers → New OAuth App
- [x] 2.2 Application name: "Grayson Portfolio (local)"
- [x] 2.3 Homepage URL: `http://localhost:8788` (informational only)
- [x] 2.4 Callback URL: `http://localhost:8788/auth/github` (wrangler pages dev runs on :8788, not :3000)
- [x] 2.5 Generate client secret; save `client_id` and `secret`

## 3. Environment Variables

- [x] 3.1 Append to `.env.example`:
  ```
  NUXT_OAUTH_GITHUB_CLIENT_ID=
  NUXT_OAUTH_GITHUB_CLIENT_SECRET=
  NUXT_SESSION_PASSWORD=
  ```
- [x] 3.2 In local `.dev.vars`, paste real values from step 2.5 (wrangler pages dev reads `.dev.vars`, not `.env`)
- [x] 3.3 Generate 32+ char random for `NUXT_SESSION_PASSWORD` (e.g. `openssl rand -base64 32`)

## 4. OAuth Route

- [x] 4.1 Create `server/routes/auth/github.get.ts`:
  ```ts
  export default defineOAuthGitHubEventHandler({
    config: { emailRequired: false },
    async onSuccess(event, { user }) {
      await setUserSession(event, { user: { id: user.id, login: user.login, avatar: user.avatar_url } })
      return sendRedirect(event, '/guestbook')
    },
  })
  ```

## 5. Guestbook GET API

- [x] 5.1 Create `server/api/guestbook.get.ts`
- [x] 5.2 Call `useDb(event).getMessages(50)` and return JSON array

## 6. Guestbook POST API

- [x] 6.1 Create `server/api/guestbook.post.ts`
- [x] 6.2 Call `getUserSession(event)`; if no `user`, return 401
- [x] 6.3 Read `{ message }` from body; validate non-empty + max 500 chars
- [x] 6.4 Hash IP via shared utility from `add-contact-form`
- [x] 6.5 Call `useDb(event).insertMessage({ githubId, name, avatar, message, createdAt: Date.now(), ipHash })`
- [x] 6.6 Return 201

## 7. Guestbook Page

- [x] 7.1 Create `app/pages/guestbook.vue` (uses `default` layout)
- [x] 7.2 Header: `— 09 / guestbook` note
- [x] 7.3 Use `useUserSession()` to access current user
- [x] 7.4 If not authenticated: show `<a href="/auth/github" class="border border-ink px-4 py-2 inline-block font-mono text-[12px]">Sign in with GitHub →</a>`
- [x] 7.5 If authenticated: show avatar (circle 32px) + name, `<textarea v-model="msg" maxlength="500">`, and a submit button that POSTs to `/api/guestbook`
- [x] 7.6 Below the form: `useFetch('/api/guestbook')` and v-for entries:
  - circular GitHub avatar 32×32
  - name (Space Mono 11px)
  - date label (formatted)
  - message body (Space Mono 12px)

## 8. Rendering & Routing

> Implementation note: original plan used `swr: 60`, but guestbook is a live +
> per-user page — SWR/prerender caching froze the page to a build-time empty
> snapshot, so new messages never appeared. Switched to `ssr: true` and excluded
> the dynamic routes from prerender.

- [x] 8.1 Set `/guestbook: { ssr: true }` in `routeRules` (NOT `swr: 60` — caching hides new messages)
- [x] 8.2 Add `/auth/**: { ssr: true }` so the OAuth handler runs on the worker
- [x] 8.3 Add `nitro.prerender.ignore: [/^\/auth\//, /^\/guestbook/]` so `crawlLinks`
      (followed from the footer link) does not prerender these into static HTML
- [x] 8.4 Wrap the auth UI (sign-in button / compose form) in `<ClientOnly>` — session
      is cookie-based and only known client-side; keeps it out of any prerendered HTML
- [x] 8.5 Add a `guestbook →` link in `SiteFooter.vue` (replaces the static `scroll ↓`)

## 9. Verification

- [x] 9.1 Run `pnpm build && npx wrangler pages dev dist`
- [x] 9.2 Visit `/guestbook` → see Sign in button
- [x] 9.3 Click Sign in → GitHub OAuth flow → redirect back authenticated
- [x] 9.4 Submit a message → page refresh shows it in the list (verified after `ssr: true` fix)
- [x] 9.5 Log out (call `useUserSession().clear()`), confirm POST returns 401 (verified via curl, no cookie → 401)
