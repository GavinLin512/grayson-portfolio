## Context

Guestbook adds a small social layer to the portfolio. To prevent spam, every commenter must authenticate via GitHub. The data lives in D1 (from `add-d1-database`). Authentication uses `nuxt-auth-utils`, which is officially recommended for Nuxt 3.

## Goals / Non-Goals

**Goals:**
- GitHub OAuth login (no other providers)
- Authenticated message submission to D1
- 60s SWR caching for the list page

**Non-Goals:**
- Message editing / deletion (one-shot submissions)
- Reactions / threading (flat list)
- Moderation queue (trust signed-in users; manual SQL delete if needed)
- Email notifications to owner (deferred; could be added later)

## Decisions

- **`nuxt-auth-utils` over `next-auth`-style libraries**: Native to Nuxt 3, simpler, supports GitHub OAuth out of the box. Sessions stored in encrypted cookies (stateless).
- **Two GitHub OAuth Apps**: One for local (`http://localhost:3000`) and one for production (`https://*.pages.dev`). Required because GitHub OAuth callbacks are domain-locked. Both sets of credentials kept in `.env` / Cloudflare Pages Dashboard.
- **`NUXT_SESSION_PASSWORD` random**: A 32+ char random string used to encrypt the session cookie. Generated once per environment.
- **SWR 60s for `/guestbook`**: Page-level caching prevents D1 hammering. New messages appear within 60 seconds for other visitors. Acceptable freshness.
- **IP hashing pattern reused from `add-contact-form`**: Same `server/utils/ratelimit.ts` hashing helper hashes the IP before storing in `guestbook.ip_hash`.

## Risks / Trade-offs

- **Risk**: GitHub OAuth callback domains drift between local and prod, breaking flow → Mitigation: document both OAuth Apps in README; check callback URL on first deploy
- **Risk**: A determined GitHub-account bot could still spam → Mitigation: D1 query for per-`github_id` rate limit (e.g., 1 message per hour per user). Defer to v2 if abuse appears
- **Trade-off**: No edit/delete UX means typos are permanent. Manual SQL deletion is the safety net
