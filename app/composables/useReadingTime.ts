function extractText(node: unknown): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  const n = node as Record<string, unknown>
  if (n.type === 'text' && typeof n.value === 'string') return n.value
  if (Array.isArray(n.children)) return (n.children as unknown[]).map(extractText).join(' ')
  return ''
}

export function useReadingTime(body: string | object): number {
  const text = typeof body === 'string' ? body : extractText(body)
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return Math.ceil(wordCount / 200)
}
