// Pagefind is generated at build time (`pagefind --site dist`) and served from
// `/pagefind/pagefind.js`. In `pnpm dev` that file does not exist, so the dynamic
// import is wrapped in try/catch and returns `null` for a graceful fallback.

export interface PagefindResult {
  url: string
  meta: { title?: string }
  excerpt: string
}

interface PagefindApi {
  init: () => Promise<void>
  search: (query: string) => Promise<{ results: { data: () => Promise<PagefindResult> }[] }>
}

let cached: PagefindApi | null | undefined

export async function initPagefind(): Promise<PagefindApi | null> {
  if (cached !== undefined) return cached
  try {
    // Path in a variable so TS/Vite don't try to statically resolve the
    // build-time-only module; `@vite-ignore` keeps it out of the bundle.
    const modulePath = '/pagefind/pagefind.js'
    const pf = (await import(/* @vite-ignore */ modulePath)) as PagefindApi
    await pf.init()
    cached = pf
    return pf
  }
  catch {
    cached = null
    return null
  }
}
