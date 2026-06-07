import { defineEventHandler, readBody, createError, getRequestHeader } from 'h3'
import { z } from 'zod'
import { checkRateLimit } from '../utils/ratelimit'
import { sendContactEmail } from '../utils/mail'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  topic: z.enum(['work', 'hello', 'speaking', 'other']),
  message: z.string().min(1).max(2000),
  turnstileToken: z.string().min(1),
})

interface TurnstileResponse {
  success: boolean
}

export default defineEventHandler(async (event) => {
  const raw = await readBody(event)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid request body' })
  }
  const { name, email, topic, message, turnstileToken } = parsed.data

  const config = useRuntimeConfig(event)

  // Verify Turnstile token. Passing the visitor IP (remoteip) lets Cloudflare
  // cross-check the token against the client that solved it.
  const remoteip = getRequestHeader(event, 'cf-connecting-ip')
  const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: config.turnstileSecretKey, response: turnstileToken, remoteip }),
  })
  const tsData = (await tsRes.json()) as TurnstileResponse
  if (!tsData.success) {
    throw createError({ statusCode: 403, message: 'Turnstile verification failed' })
  }

  // Check rate limit: 10 requests per hour per IP
  const allowed = await checkRateLimit(event, 'contact', 10, 3600)
  if (!allowed) {
    throw createError({ statusCode: 429, message: 'Too many requests' })
  }

  try {
    await sendContactEmail({ name, email, topic, message }, config.resendApiKey, config.public.contactEmail)
  }
  catch {
    // Static log only — no variables, so no request/response data can leak
    // into logs (CWE-532). Detailed cause lives in the Resend dashboard.
    // Client gets a generic message. (security.md §3)
    console.error('[contact] email send failed')
    throw createError({ statusCode: 502, message: 'Failed to send message' })
  }

  return { ok: true }
})
