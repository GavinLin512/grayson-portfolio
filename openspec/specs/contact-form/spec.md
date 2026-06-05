# contact-form Specification

## Purpose
Defines the `/contact` page and its message-sending pipeline: a two-column layout (hero + contact info / form), a message-topic selector, invisible Turnstile bot protection with progressive submit feedback, and a server route that verifies the token, rate-limits by IP, and sends mail via Resend.

## Requirements
### Requirement: Contact route SHALL render a two-column form

The `/contact` route SHALL render a split layout. The left column SHALL contain a hero block (a `font-mincho` headline, a `font-mono` introductory line, a divider) followed by contact info as label-left / value-right aligned rows (`email` / `github` / `read.cv` / `location`). The right column SHALL contain the message form (name / email / topic selector / message / submit), fill the remaining viewport height, and the page root SHALL follow the full-bleed convention (`relative h-full flex flex-col` with the main content area using `flex-1`).

#### Scenario: Left column hero block renders

- **WHEN** the page is rendered
- **THEN** the left column shows a `font-mincho` headline ("say hello, / or send a postcard."), a `font-mono` intro line ("i answer within a few days. for work, tell me the shape of the problem."), and a `border-t border-line` divider above the contact info

#### Scenario: Contact info rows are label-left / value-right aligned

- **WHEN** the page is rendered
- **THEN** the left column lists `email`, `github`, `read.cv`, and `location` rows, each with the label on the left and the value right-aligned, where `location` reads `taipei · GMT+8`

#### Scenario: Form fields exist with correct styling

- **WHEN** the page is rendered
- **THEN** the right column contains `<input>` elements for name and email, a `<textarea>` for message, each with `border: 1px solid var(--ink); background: var(--paper); margin-top: 6px`, and the message `<textarea>` fills the remaining column height (`flex-1`)

#### Scenario: Turnstile verification is invisible with a caption

- **WHEN** the page is rendered
- **THEN** no visible Turnstile widget box is shown; verification runs in Cloudflare Turnstile invisible mode using the site key from `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, and a `font-mono` caption "· protected by friendliness, not captcha" appears in the form footer

### Requirement: Submit SHALL POST to /api/contact

The form SHALL submit a JSON POST to `/api/contact` with `{ name, email, topic, message, turnstileToken }`, where `topic` is one of `work | hello | speaking | other`. The submit control SHALL be a filled (`bg-ink text-bg`) button labelled "send →", aligned to the bottom-right of the form.

#### Scenario: Successful submission includes topic

- **WHEN** the user fills the form correctly and submits
- **THEN** the request body contains all five fields including the selected `topic`, and the API returns 200

#### Scenario: Success message displays after submission

- **WHEN** the API returns 200
- **THEN** the form is replaced by a `font-hand` success note (e.g., "— thanks. i'll write back soon.")

#### Scenario: Server validates topic

- **WHEN** the request body is validated by the zod schema on `server/api/contact.post.ts`
- **THEN** `topic` MUST be one of `work | hello | speaking | other`, otherwise the API responds with 400, and the selected topic is included in the email sent via Resend

### Requirement: Contact form SHALL offer a message-topic selector

The form SHALL render a "what kind of message?" selector as a group of pill buttons (`work` / `hello` / `speaking` / `other`). Exactly one topic SHALL be selected at a time, defaulting to `work` on load. The selected pill SHALL render filled (`bg-ink text-bg`); unselected pills SHALL render outlined (`border border-ink`).

#### Scenario: Default topic is selected on load

- **WHEN** the page is rendered
- **THEN** the `work` pill is shown as selected (filled) and the other pills are outlined

#### Scenario: Selecting a topic updates the active pill

- **WHEN** the user clicks the `speaking` pill
- **THEN** `speaking` becomes the selected (filled) pill, `work` returns to outlined, and a subsequent submission posts `topic: "speaking"`

### Requirement: Invisible verification SHALL run on submit with progressive feedback

The form SHALL render Turnstile with `execution: 'execute'` so the challenge runs only when the user submits (keeping the token fresh within its 300s lifetime). On submit the UI SHALL enter a busy state immediately; when no token exists yet it SHALL trigger `turnstile.execute()` and wait for the callback rather than rejecting with a "please verify" error, capped by a timeout so the UI never hangs.

#### Scenario: Submit before token is ready shows verifying state then completes

- **WHEN** the user submits while no Turnstile token has been issued yet
- **THEN** the submit button immediately shows `verifying...`, `turnstile.execute()` is invoked, and once the token callback fires the request is sent with that token (button showing `sending...`)

#### Scenario: Verification timeout surfaces a retryable error

- **WHEN** verification does not produce a token within the client timeout (12s)
- **THEN** the form shows a "verification is taking too long — please try again." message and leaves the form intact for retry

#### Scenario: Server cross-checks the visitor IP

- **WHEN** the server verifies the token at Cloudflare's siteverify endpoint
- **THEN** the request includes `remoteip` read from the `cf-connecting-ip` header

### Requirement: Server SHALL verify Turnstile token before sending mail

`server/api/contact.post.ts` SHALL verify the Turnstile token by POSTing to Cloudflare's siteverify endpoint with `NUXT_TURNSTILE_SECRET_KEY`. Only if the verification succeeds SHALL the mail be sent.

#### Scenario: Invalid token rejects request

- **WHEN** the submitted `turnstileToken` fails verification
- **THEN** the API responds with 403 and does NOT call the Resend API

### Requirement: Server SHALL rate-limit submissions by IP

The server SHALL allow at most 10 submissions per hour per IP, using Cloudflare KV as the counter store. IP is read from the `cf-connecting-ip` request header.

#### Scenario: 11th submission within an hour is rejected

- **WHEN** the same IP submits 11 requests within 60 minutes
- **THEN** the 11th request receives a 429 response

### Requirement: Server SHALL send mail via Resend API

After Turnstile + rate-limit checks pass, the server SHALL POST to Resend's `/emails` endpoint with `NUXT_RESEND_API_KEY`, sending the message to `NUXT_PUBLIC_CONTACT_EMAIL`.

#### Scenario: Email arrives at configured address

- **WHEN** a valid submission passes all checks
- **THEN** an email arrives at the address configured in `NUXT_PUBLIC_CONTACT_EMAIL` within 60 seconds

### Requirement: Contact route SHALL be server-rendered

`routeRules` SHALL set `/contact: { ssr: true }` so each request gets a fresh CSRF token in the Turnstile widget.

#### Scenario: SSR is active

- **WHEN** the page is requested
- **THEN** the response is dynamically rendered (not statically prerendered)
