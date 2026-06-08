# blog-comments Specification

## Purpose

Defines per-post blog comments — GitHub-OAuth-gated messages stored in D1 `comments` table, scoped by `post_slug`, with a shared `<Comments>` component reused across guestbook and blog detail pages, comments loaded client-side (CSR island) to keep article prerendering intact.

## Requirements

### Requirement: Blog detail pages SHALL show a per-post comments section

Each `/blog/<slug>` page SHALL render a comments section below the article body. The section SHALL list existing comments for that post and provide a way to add one.

#### Scenario: Comments section appears on a blog post

- **WHEN** a visitor opens a blog post at `/blog/<slug>`
- **THEN** a comments section is rendered below the article content

#### Scenario: Comments are scoped to the post

- **WHEN** post A has comments and the visitor opens post B
- **THEN** only post B's comments are shown; post A's comments do not appear

### Requirement: Comment list SHALL be public and scoped by post slug

GET `/api/comments?slug=<slug>` SHALL return up to 50 most recent comments for the given `post_slug`, ordered by `created_at` descending. The endpoint SHALL NOT require authentication.

#### Scenario: Missing slug is rejected

- **WHEN** GET `/api/comments` is called without a `slug` query parameter
- **THEN** the API responds with 400

#### Scenario: Anonymous read succeeds

- **WHEN** an unauthenticated visitor requests `/api/comments?slug=<slug>`
- **THEN** the API returns the post's comments (up to 50, most recent first)

### Requirement: Comment submission SHALL require GitHub authentication

POST `/api/comments` SHALL be accepted only from authenticated users. The body SHALL contain `slug` and `message`; `message` SHALL be 1–500 characters. On success the endpoint SHALL insert a row into `comments` with the user's GitHub id, name, avatar, the slug, message, current timestamp, and hashed IP, and return 201.

#### Scenario: Authenticated POST succeeds

- **WHEN** an authenticated user submits a valid `{ slug, message }`
- **THEN** the API returns 201 and a SELECT against `comments` shows the new row with the matching `post_slug`

#### Scenario: Unauthenticated POST is rejected

- **WHEN** a request without a valid session cookie is POSTed to `/api/comments`
- **THEN** the API responds with 401

#### Scenario: Invalid body is rejected

- **WHEN** an authenticated user POSTs a body missing `slug`/`message` or with a message longer than 500 characters
- **THEN** the API responds with 400

### Requirement: Comments SHALL reuse a shared component across guestbook and blog

A single `app/components/Comments.vue` SHALL render both the guestbook (no `slug` prop) and blog comments (with `slug` prop). When `slug` is provided it SHALL target `/api/comments`; otherwise it SHALL target `/api/guestbook`.

#### Scenario: Guestbook uses the shared component without a slug

- **WHEN** `/guestbook` renders the component without a `slug` prop
- **THEN** it lists and submits via `/api/guestbook`

#### Scenario: Blog uses the shared component with a slug

- **WHEN** a blog post renders the component with its `slug`
- **THEN** it lists via `/api/comments?slug=<slug>` and submits to `/api/comments` with that slug

### Requirement: Article content SHALL remain prerendered with comments loaded client-side

Blog detail pages SHALL stay `prerender: true`. Comment data SHALL be fetched on the client so the prerendered HTML contains no comment data and the article remains statically indexable by Pagefind.

#### Scenario: Prerendered HTML excludes comment data

- **WHEN** `pnpm build` runs
- **THEN** `dist/blog/<slug>/index.html` exists (article prerendered) and contains no rendered comment rows

#### Scenario: Comments hydrate on the client

- **WHEN** a visitor loads a prerendered blog post in the browser
- **THEN** the comments list is fetched client-side and displayed after hydration
