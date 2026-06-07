import type { H3Event } from 'h3'

export interface GuestbookRow {
  id: number
  github_id: string
  name: string
  avatar: string | null
  message: string
  created_at: number
  ip_hash: string | null
}

export interface InsertMessageParams {
  github_id: string
  name: string
  avatar: string | null
  message: string
  created_at: number
  ip_hash: string | null
}

export function useDb(event: H3Event) {
  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({
      statusCode: 500,
      message: 'D1 binding (DB) is not available. Run via wrangler pages dev.',
    })
  }

  return {
    getMessages(limit = 50) {
      return db
        .prepare('SELECT * FROM guestbook ORDER BY created_at DESC LIMIT ?')
        .bind(limit)
        .all<GuestbookRow>()
    },

    insertMessage(params: InsertMessageParams) {
      return db
        .prepare(
          'INSERT INTO guestbook (github_id, name, avatar, message, created_at, ip_hash) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind(
          params.github_id,
          params.name,
          params.avatar,
          params.message,
          params.created_at,
          params.ip_hash,
        )
        .run()
    },
  }
}
