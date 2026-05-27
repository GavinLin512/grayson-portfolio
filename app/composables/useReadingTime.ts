// Nuxt Content v3 以 minimark 格式儲存 body：
//   { type: "minimark", value: [["p", {}, "text..."], ["h2", { id }, "Brief"], ...] }
// 每個節點是 positional array `[tag, attrs, ...children]`，文字直接以 string 接在第 3 位之後，
// 沒有 `{ type: "text", value }` 包裝，也沒有 `.children` 欄位 — 與舊版 hast / MDC AST 不同。
function extractText(node: unknown): string {
  if (!node) return ''
  if (typeof node === 'string') return node

  // minimark 節點：array 形式 [tag, attrs, ...children]，從 index 2 開始遞迴
  if (Array.isArray(node)) {
    return node.slice(2).map(extractText).join(' ')
  }

  const n = node as Record<string, unknown>

  // 頂層 minimark 容器
  if (n.type === 'minimark' && Array.isArray(n.value)) {
    return (n.value as unknown[]).map(extractText).join(' ')
  }

  // 舊版 hast / MDC AST 相容 fallback
  if (n.type === 'text' && typeof n.value === 'string') return n.value
  if (Array.isArray(n.children)) return (n.children as unknown[]).map(extractText).join(' ')

  return ''
}

export function useReadingTime(body: string | object): number {
  const text = typeof body === 'string' ? body : extractText(body)
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return Math.ceil(wordCount / 200)
}
