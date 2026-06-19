import sanitizeHtml from 'sanitize-html'

// Raw jf2 item from webmention.io. The `content` object is inconsistent across
// mentions: it may be { content-type, value }, { html }, or include a `text`
// field for plain-text replies. The source URL lives in `wm-source` (the
// top-level `source` is always null), so we normalize everything here.
interface Jf2Author {
  name?: string
  photo?: string
  url?: string
}

interface Jf2Content {
  'content-type'?: string
  value?: string
  html?: string
  text?: string
}

interface Jf2Item {
  type: string
  url?: string
  'wm-source'?: string
  'wm-received'?: string
  author?: Jf2Author
  content?: Jf2Content
}

interface Jf2Feed {
  type: string
  name: string
  children: Jf2Item[]
}

// Normalized shape consumed by Webmentions.vue.
interface Mention {
  type: string
  source: string
  author?: Jf2Author
  text?: string
  'wm-received'?: string
}

// webmention.io strips empty author fields to "" rather than omitting them;
// collapse those to undefined so the component's `?? 'anonymous'` fallback works.
function cleanAuthor(author?: Jf2Author): Jf2Author | undefined {
  if (!author) return undefined
  const name = author.name || undefined
  const photo = author.photo || undefined
  const url = author.url || undefined
  if (!name && !photo && !url) return undefined
  return { name, photo, url }
}

// Pull a plain-text excerpt out of whichever content variant we got. HTML is
// stripped via sanitize-html (allowedTags: []) per security.md §1 — never hand-roll.
function extractText(content?: Jf2Content): string | undefined {
  if (!content) return undefined
  if (content.text) return content.text
  const html = content.html ?? (content['content-type'] === 'text/html' ? content.value : undefined)
  if (html) {
    return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
      .replace(/\s+/g, ' ')
      .trim() || undefined
  }
  return content.value || undefined
}

export default defineCachedEventHandler(
  async (event) => {
    const { target } = getQuery(event)
    if (!target || typeof target !== 'string') {
      throw createError({ statusCode: 400, message: 'target is required' })
    }
    const data = await $fetch<Jf2Feed>('https://webmention.io/api/mentions.jf2', {
      query: { target },
    })
    return (data.children ?? []).map<Mention>(item => ({
      type: item.type,
      source: item['wm-source'] ?? item.url ?? '',
      author: cleanAuthor(item.author),
      text: extractText(item.content),
      'wm-received': item['wm-received'],
    }))
  },
  {
    maxAge: 60 * 60,
    getKey: event => `webmentions-${getQuery(event).target}`,
  },
)
