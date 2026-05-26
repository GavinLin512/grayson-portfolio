import { queryCollection } from '@nuxt/content/server'
import { defineEventHandler, setHeader } from 'h3'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

  const posts = await queryCollection(event, 'blog').order('date', 'DESC').all()

  const siteUrl = 'https://grayson.cc'

  const items = posts
    .map((post) => {
      const slug = post.path.split('/').pop() ?? ''
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${escapeXml(slug)}</link>
      <guid>${siteUrl}/blog/${escapeXml(slug)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.description ?? '')}</description>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Grayson's Journal</title>
    <link>${siteUrl}/blog</link>
    <description>Notes on design, code, and craft.</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`
})
