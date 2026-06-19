import { queryCollection } from '@nuxt/content/server'
import { defineEventHandler, setHeader } from 'h3'
import { encodeXML } from 'entities'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

  const posts = await queryCollection(event, 'blog').order('date', 'DESC').all()

  const siteUrl = 'https://grayson512portfolio.dpdns.org'

  const items = posts
    .map((post) => {
      const slug = post.path.split('/').pop() ?? ''
      return `    <item>
      <title>${encodeXML(post.title)}</title>
      <link>${siteUrl}/blog/${encodeXML(slug)}</link>
      <guid>${siteUrl}/blog/${encodeXML(slug)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${encodeXML(post.description ?? '')}</description>
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
