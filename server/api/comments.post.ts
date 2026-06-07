import { z } from 'zod'

const schema = z.object({
  slug: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, message: 'Invalid request body' })
  }

  const ip =
    getRequestHeader(event, 'cf-connecting-ip') ??
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  const ipHash = await hashIP(ip)

  const user = session.user as { id: number; login: string; avatar: string }

  await useDb(event).insertComment({
    post_slug: result.data.slug,
    github_id: String(user.id),
    name: user.login,
    avatar: user.avatar ?? null,
    message: result.data.message,
    created_at: Date.now(),
    ip_hash: ipHash,
  })

  setResponseStatus(event, 201)
  return { ok: true }
})
