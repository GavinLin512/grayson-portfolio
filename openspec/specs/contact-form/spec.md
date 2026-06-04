# contact-form Specification

## Purpose
TBD - created by archiving change add-contact-form. Update Purpose after archive.
## Requirements
### Requirement: Contact route SHALL render a two-column form

The `/contact` route SHALL render a split layout: left column with contact info (email / GitHub / location, each as label + value), right column with the message form (name / email / message / Turnstile widget / submit button).

#### Scenario: Form fields exist with correct styling

- **WHEN** the page is rendered
- **THEN** the right column contains `<input>` elements for name and email, a `<textarea>` for message, each with `height: 38px; border: 1px solid var(--ink); background: var(--paper); margin-top: 6px`

#### Scenario: Turnstile widget loads

- **WHEN** the page is rendered
- **THEN** a Cloudflare Turnstile widget is embedded in the form with the site key from `NUXT_TURNSTILE_SITE_KEY`

### Requirement: Submit SHALL POST to /api/contact

The form SHALL submit a JSON POST to `/api/contact` with `{ name, email, message, turnstileToken }`.

#### Scenario: Successful submission

- **WHEN** the user fills the form correctly and submits
- **THEN** the request body contains all four fields, and the API returns 200

#### Scenario: Success message displays after submission

- **WHEN** the API returns 200
- **THEN** the form is replaced by a `font-hand` success note (e.g., "— thanks. i'll write back soon.")

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
