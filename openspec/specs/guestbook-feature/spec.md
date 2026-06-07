# guestbook-feature Specification

## Purpose
Defines the `/guestbook` page — GitHub-OAuth-gated visitor messages stored in D1, with public read and authenticated write, showing the 50 most recent entries, server-rendered on every request for live freshness.

## Requirements

### Requirement: Guestbook route SHALL show signed-in or signed-out state

The `/guestbook` route SHALL render:
- If user is NOT authenticated: a "Sign in with GitHub" button at the top
- If user IS authenticated: their avatar + name, a textarea, and a submit button

#### Scenario: Unauthenticated user sees sign-in CTA

- **WHEN** an anonymous visitor opens `/guestbook`
- **THEN** the top of the page displays a "Sign in with GitHub" button linking to `/auth/github`

#### Scenario: Authenticated user sees compose form

- **WHEN** an authenticated user opens `/guestbook`
- **THEN** the top shows their GitHub avatar + username, a textarea, and a submit button

### Requirement: GitHub OAuth SHALL authenticate users

The system SHALL implement GitHub OAuth using `nuxt-auth-utils`. On successful OAuth callback, the user's GitHub `id`, `login`, and `avatar_url` SHALL be stored in a session cookie encrypted with `NUXT_SESSION_PASSWORD`.

#### Scenario: OAuth flow completes

- **WHEN** an unauthenticated user clicks "Sign in with GitHub" and approves the OAuth app
- **THEN** the browser redirects back to `/guestbook` and the user is now authenticated

### Requirement: Authenticated user SHALL be able to submit a message

The system SHALL accept POST `/api/guestbook` from authenticated users only. The endpoint SHALL insert a new row into the `guestbook` table with the user's GitHub id, name, avatar, message text, current timestamp, and hashed IP.

#### Scenario: Authenticated POST succeeds

- **WHEN** an authenticated user submits a 50-character message
- **THEN** the API returns 201, and a SELECT against the table shows the new row

#### Scenario: Unauthenticated POST is rejected

- **WHEN** a request without a valid session cookie is POSTed to `/api/guestbook`
- **THEN** the API responds with 401

### Requirement: Guestbook list SHALL show the 50 most recent messages

GET `/api/guestbook` SHALL return up to 50 most recent messages from the `guestbook` table, ordered by `created_at` descending.

#### Scenario: List returns latest entries

- **WHEN** there are 60 messages in the table and the API is called
- **THEN** the response contains 50 messages, the most recent first

### Requirement: Guestbook list SHALL render entries with avatar, name, date, message

The page SHALL render each entry as: GitHub avatar (circular), name (label), date (label), message body (note).

#### Scenario: Entry shows all four fields

- **WHEN** an entry is rendered
- **THEN** the DOM contains an `<img>` (circular avatar), a label with name, a label with formatted date, and a note element with the message text

### Requirement: Guestbook route SHALL be server-rendered on every request

`routeRules` SHALL set `/guestbook: { ssr: true }` (NOT cached). Because the page shows
live, frequently-changing messages and per-user auth state, caching modes (SWR/ISR/prerender)
serve a stale build-time snapshot and hide new messages. The route SHALL also be excluded from
prerender (`nitro.prerender.ignore`) so `crawlLinks` does not emit it as static HTML.

#### Scenario: Fresh data on every load

- **WHEN** a new message is submitted and the page is reloaded
- **THEN** the reload is server-rendered and includes the newly submitted message

#### Scenario: Dynamic routes are not prerendered

- **WHEN** `pnpm build` runs
- **THEN** `dist/guestbook/` and `dist/auth/github/` are NOT emitted as static HTML
