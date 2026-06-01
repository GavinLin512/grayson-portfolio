<template>
  <div v-if="post" class="relative h-full flex flex-col">
    <!-- Header -->
    <div class="shrink-0 mb-[48px]">
      <div class="flex items-center justify-between">
        <span class="font-mono text-[15px] opacity-70">— journal · {{ slug }}</span>
      </div>
      <div class="border-t border-line mt-[14px] mb-[32px]" />

      <h1 class="font-mincho text-[52px] leading-[1.1] max-w-[860px] mb-[20px]">
        {{ post.title }}
      </h1>

      <div class="flex items-center gap-[20px] flex-wrap">
        <span class="font-mono text-[12px] opacity-55">{{ formatDate(post.date) }}</span>
        <span class="font-mono text-[12px] opacity-55">·</span>
        <span class="font-mono text-[12px] opacity-55">{{ readingTime }} min read</span>
        <div class="flex gap-[8px] flex-wrap">
          <TagChip v-for="tag in post.tags" :key="tag">{{ tag }}</TagChip>
        </div>
      </div>
    </div>

    <!-- Three-column grid -->
    <div class="grid grid-cols-1 lg:grid-cols-[180px_1fr_180px] gap-[60px]">
      <!-- Left: TOC -->
      <aside class="hidden lg:block">
        <div
          v-if="toc.length"
          class="sticky top-[60px] space-y-[6px]"
        >
          <div class="font-mono text-[11px] opacity-40 mb-[12px] uppercase tracking-wider">contents</div>
          <a
            v-for="link in toc"
            :key="link.id"
            :href="`#${link.id}`"
            class="block font-mono text-[12px] leading-[1.5] transition-opacity"
            :class="[
              link.depth === 3 ? 'pl-[12px]' : '',
              activeId === link.id ? 'opacity-100' : 'opacity-40 hover:opacity-70',
            ]"
          >
            {{ link.text }}
          </a>
        </div>
      </aside>

      <!-- Center: article content -->
      <article class="prose-blog min-w-0">
        <ContentRenderer :value="post" />
      </article>

      <!-- Right: also reading -->
      <aside class="hidden lg:block">
        <div v-if="relatedPosts.length" class="sticky top-[60px]">
          <div class="font-mono text-[11px] opacity-40 mb-[16px] uppercase tracking-wider">also reading</div>
          <div class="space-y-[20px]">
            <NuxtLink
              v-for="related in relatedPosts"
              :key="related.path"
              :to="related.path"
              class="block group"
            >
              <div class="font-mincho text-[14px] leading-[1.35] mb-[4px] group-hover:opacity-70 transition-opacity">
                {{ related.title }}
              </div>
              <div class="font-mono text-[11px] opacity-40">read →</div>
            </NuxtLink>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <div v-else class="font-mono text-[13px] opacity-50 py-[60px]">post not found</div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: post } = await useAsyncData(`blog-${slug.value}`, () =>
  queryCollection('blog').path(route.path).first()
)

const { data: allPosts } = await useAsyncData('blog-related', () =>
  queryCollection('blog').order('date', 'DESC').all()
)

const readingTime = computed(() =>
  post.value ? useReadingTime(post.value.body) : 0
)

const toc = computed(() => {
  if (!post.value?.body?.toc?.links) return []
  return flattenToc(post.value.body.toc.links)
})

function flattenToc(links: Array<{ id: string; text: string; depth: number; children?: typeof links }>): Array<{ id: string; text: string; depth: number }> {
  const result: Array<{ id: string; text: string; depth: number }> = []
  for (const link of links) {
    result.push({ id: link.id, text: link.text, depth: link.depth })
    if (link.children?.length) {
      result.push(...flattenToc(link.children))
    }
  }
  return result
}

const relatedPosts = computed(() => {
  if (!allPosts.value) return []
  return allPosts.value.filter((p) => p.path !== route.path).slice(0, 3)
})

const activeId = ref('')

onMounted(() => {
  if (!toc.value.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
  )

  const headings = document.querySelectorAll('article h2, article h3')
  headings.forEach((el) => observer.observe(el))

  onUnmounted(() => observer.disconnect())
})

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${day}`
}

definePageMeta({ layout: 'content' })
</script>

<style>
.prose-blog h2 {
  font-family: var(--font-mincho, 'Shippori Mincho', serif);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.25;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}

.prose-blog h3 {
  font-family: var(--font-mincho, 'Shippori Mincho', serif);
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.prose-blog p {
  font-size: 0.9375rem;
  line-height: 1.75;
  margin-bottom: 1.25rem;
  opacity: 0.85;
}

.prose-blog pre {
  background: transparent;
  border: 1px solid var(--line, currentColor);
  padding: 1.25rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.prose-blog code {
  font-family: 'Space Mono', monospace;
  font-size: 0.8125rem;
}

.prose-blog :not(pre) > code {
  background: transparent;
  border: 1px solid var(--line, currentColor);
  padding: 0.1em 0.35em;
  opacity: 0.8;
}

.prose-blog ul, .prose-blog ol {
  padding-left: 1.5rem;
  margin-bottom: 1.25rem;
  opacity: 0.85;
}

.prose-blog li {
  font-size: 0.9375rem;
  line-height: 1.75;
  margin-bottom: 0.25rem;
}

.prose-blog img {
  max-width: 100%;
  margin: 1.5rem 0;
  opacity: 0.9;
}

.prose-blog a {
  text-decoration: underline;
  opacity: 0.75;
}

.prose-blog a:hover {
  opacity: 1;
}
</style>
