import type { H3Event } from 'h3'
import { getRequestHeader } from 'h3'

export async function checkRateLimit(
  event: H3Event,
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const ip =
    getRequestHeader(event, 'cf-connecting-ip') ??
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'

  const kv = (event.context.cloudflare as any)?.env?.RATE_LIMIT
  if (!kv) return true // KV not available in local dev — allow

  const hash = await hashIP(ip)
  const kvKey = `${key}:${hash}`

  const current = await kv.get(kvKey)
  const count = current ? parseInt(current, 10) : 0

  if (count >= max) return false

  await kv.put(kvKey, String(count + 1), { expirationTtl: windowSeconds })
  return true
}
