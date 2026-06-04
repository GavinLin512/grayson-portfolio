import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { checkRateLimit } from '../utils/ratelimit'
import { sendContactEmail } from '../utils/mail'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
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
  const { name, email, message, turnstileToken } = parsed.data

  const config = useRuntimeConfig(event)

  // Verify Turnstile token
  const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: config.turnstileSecretKey, response: turnstileToken }),
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
    await sendContactEmail({ name, email, message }, config.resendApiKey, config.public.contactEmail)
  }
  catch (err) {
    // Log the real cause server-side; return a generic message to the client
    // so internal details (Resend response, stack) aren't leaked. (security.md §3)
    console.error('[contact] sendContactEmail failed:', err)
    throw createError({ statusCode: 502, message: 'Failed to send message' })
  }

  return { ok: true }
})
