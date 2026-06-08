## 1. Database Migration

- [x] 1.1 Create `migrations/0002_comments.sql`:
  ```sql
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_slug TEXT NOT NULL,
    github_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    ip_hash TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_comments_slug_created
    ON comments(post_slug, created_at DESC);
  ```
- [x] 1.2 Run local migration: `npx wrangler d1 execute grayson-portfolio-db --local --file=migrations/0002_comments.sql`

## 2. DB Utility

- [x] 2.1 Extend `server/utils/db.ts` `useDb(event)` with `getComments(slug, limit = 50)`:
      `SELECT * FROM comments WHERE post_slug = ? ORDER BY created_at DESC LIMIT ?`
- [x] 2.2 Add `insertComment(params)` with prepared statement inserting
      `post_slug, github_id, name, avatar, message, created_at, ip_hash`
- [x] 2.3 Add `CommentRow` / `InsertCommentParams` interfaces

## 3. Comments GET API

- [x] 3.1 Create `server/api/comments.get.ts`
- [x] 3.2 Read `slug` from query; validate non-empty (400 if missing)
- [x] 3.3 Call `useDb(event).getComments(slug, 50)`, return `results`

## 4. Refactor: extract `hashIP` to `hash.ts`

> `hashIP` currently lives in `server/utils/ratelimit.ts` but is no longer
> rate-limit-specific — guestbook + comments both hash the IP before storing.
> Extract it so the name matches its home (see foundation note on shared utils).

- [x] 4.1 Create `server/utils/hash.ts`; move `hashIP` (+ its `SALT`) there
- [x] 4.2 Update `server/utils/ratelimit.ts` to use `hashIP` from the new module (drop the local copy)
- [x] 4.3 Update `server/api/guestbook.post.ts` to use `hashIP` from `hash.ts`
      (Nitro auto-import resolves it; verify guestbook still writes `ip_hash`)

## 5. Comments POST API

- [x] 5.1 Create `server/api/comments.post.ts`
- [x] 5.2 `getUserSession(event)`; if no `user`, return 401
- [x] 5.3 zod-validate body `{ slug: string (1..200), message: string (1..500) }`; 400 on fail
- [x] 5.4 Hash IP via `hashIP` from `server/utils/hash.ts`
- [x] 5.5 Call `insertComment({ post_slug, github_id, name, avatar, message, created_at: Date.now(), ip_hash })`
- [x] 5.6 Return 201

## 6. Shared Comments Component

- [x] 6.1 Create `app/components/Comments.vue` with prop `slug?: string`
- [x] 6.2 Compute `listUrl` / `postUrl` from `slug` (slug present → `/api/comments`, absent → `/api/guestbook`)
- [x] 6.3 Wrap auth UI (sign-in button / compose form) in `<ClientOnly>` (session is client-only)
- [x] 6.4 Fetch list client-side (`server: false`) so prerendered pages stay static
- [x] 6.5 Render entries: circular avatar 32px, name (mono 11px), date label, message (mono 12px)
- [x] 6.6 POST includes `slug` when in blog mode; on success clear textarea + `refresh()`

## 7. Refactor Guestbook

- [x] 7.1 Replace `app/pages/guestbook.vue` form+list markup with `<Comments />` (no slug)
- [x] 7.2 Keep `PageHeader label="— 09 / guestbook"` and page layout wrapper
- [x] 7.3 Verify guestbook still reads/writes via `/api/guestbook` unchanged

## 8. Blog Detail Integration

- [x] 8.1 In `app/pages/blog/[slug].vue`, add a comments section below the three-column grid
- [x] 8.2 Render `<Comments :slug="slug" />` with a heading (e.g. `— comments`)
- [x] 8.3 Confirm `/blog/**` stays `prerender: true` (article HTML unchanged; comments load client-side)

## 9. Verification

- [x] 9.1 `pnpm build` → confirm `dist/blog/<slug>/index.html` exists (article still prerendered)
      and contains NO comment data (comments are CSR)
- [x] 9.2 `npx wrangler pages dev dist` → open a blog post → see comments section + Sign in button
- [x] 9.3 Sign in → post a comment on post A → appears in list; refresh → still shows (CSR refetch)
- [x] 9.4 Open post B → comment from post A does NOT appear (slug isolation)
- [x] 9.5 Confirm `/guestbook` still works (shared component regression check)
- [x] 9.6 Logged-out POST to `/api/comments` returns 401

## 10. Post-OAuth redirect to origin page

> Emerged during verification: signing in from a blog post redirected to
> `/guestbook` (hardcoded in `github.get.ts`'s `onSuccess`). A blog commenter
> should return to the article they were reading.

- [x] 10.1 Add `server/routes/auth/login.get.ts` — stores a `?redirect=` (relative-path only,
      open-redirect guarded) in a short-lived `auth_redirect` cookie, then redirects to `/auth/github`
- [x] 10.2 `github.get.ts` `onSuccess` reads + clears the cookie; redirects there if it's a
      relative path, else falls back to `/guestbook`
- [x] 10.3 `Comments.vue` sign-in link points at `/auth/login?redirect=<current path>`
      (covered by existing `prerender.ignore: /^\/auth\//`)
