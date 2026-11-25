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

// 英文以空白分詞，每分鐘 200 字。中文、日文沒有空白，改算字數：成人默讀常見的估計是
// 每分鐘 300–500 字（朗讀約 255 字），取 400。中文夾英文、程式碼的文章兩者分開算再相加。
const WORDS_PER_MINUTE = 200
const CJK_CHARS_PER_MINUTE = 400
const CJK_CHAR = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu
// 全形標點（，。「」：）與中文字一起換成空白，免得被當成英文單字；英文文章的算法因此完全不變
const CJK_PUNCTUATION = /[\u3000-\u303F\uFF00-\uFFEF]/g

export function useReadingTime(body: string | object): number {
  const text = typeof body === 'string' ? body : extractText(body)
  const cjkCount = text.match(CJK_CHAR)?.length ?? 0
  const words = text.replace(CJK_CHAR, ' ').replace(CJK_PUNCTUATION, ' ')
  const wordCount = words.trim().split(/\s+/).filter(Boolean).length
  return Math.ceil(wordCount / WORDS_PER_MINUTE + cjkCount / CJK_CHARS_PER_MINUTE)
}
