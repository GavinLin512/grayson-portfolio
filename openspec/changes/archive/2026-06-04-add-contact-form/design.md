## Context

The contact form is the primary inbound communication channel. It must be protected against spam (Turnstile), abuse (rate limit), and reliable (Resend). It runs on Cloudflare Workers via the Pages Functions integration.

## Goals / Non-Goals

**Goals:**
- Spam protection without CAPTCHA friction (Turnstile invisible challenge)
- IP-based rate limit (10/hour) via KV
- Email delivery via Resend (free tier 3000/month is plenty)
- Local dev works with Cloudflare test keys (no signups needed)

**Non-Goals:**
- File attachments (URL links suffice)
- HTML email formatting (plain text is fine)
- Receipt / auto-reply to sender (one-way: visitor → owner)

## Decisions

- **Cloudflare test keys for local dev**: `1x00000000000000000000AA` (site) and `1x0000000000000000000000000000000AA` (secret) always pass verification, safe to commit to `.env.example`. Production keys come from Cloudflare Pages Dashboard env vars.
- **Resend via fetch, not SDK**: The Resend Node SDK adds ~100KB to the Worker bundle for a feature that's a single REST call. We use `globalThis.fetch` directly.
- **KV rate limit, not D1**: KV is eventually-consistent but cheap and fast for counters. D1 would be overkill for a 10/hour limit.
- **IP hashed before storing**: Use `SHA-256(ip + salt)` as the KV key. Avoids storing raw IPs (GDPR-friendly).

## Risks / Trade-offs

- **Risk**: Resend's free tier rate limit (100/day) — Mitigation: KV rate limit at 10/hour caps daily volume at 240, well under Resend's limit; spam from a single IP is bounded
- **Risk**: Turnstile widget JS may fail to load in some regions → Mitigation: fall back to a simple honeypot field (hidden input that bots will fill)
- **Trade-off**: Server-rendered `/contact` adds Worker invocations to every visit. Acceptable: low traffic; Cloudflare Workers free tier is 100K/day
