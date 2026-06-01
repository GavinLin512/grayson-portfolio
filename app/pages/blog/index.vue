<template>
  <div class="relative h-full flex flex-col">
    <PageHeader :label="`— 03 / journal · ${visiblePosts.length} notes`">
      <div class="flex gap-[8px] flex-wrap">
        <button
          v-for="tag in tags"
          :key="tag"
          class="font-mono text-[12px] leading-none uppercase tracking-wider px-[14px] py-[4px] rounded-full border border-ink transition"
          :class="activeTag === tag ? 'bg-ink text-bg' : 'opacity-70 hover:opacity-100'"
          @click="activeTag = tag"
        >
          {{ tag }}
        </button>
      </div>
    </PageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[60px] flex-1">
      <!-- Main column: post list -->
      <div>
        <NuxtLink
          v-for="post in visiblePosts"
          :key="post.path"
          :to="post.path"
          class="group block border-b border-line py-[28px] transition-opacity hover:opacity-80"
        >
          <div class="flex justify-between items-center font-mono text-[12px] opacity-55 mb-[10px]">
            <span>{{ formatDate(post.date) }}</span>
            <span>{{ useReadingTime(post.body) }} min</span>
          </div>
          <h2 class="font-mincho text-[24px] leading-[1.25] mb-[12px] group-hover:opacity-70 transition-opacity">
            {{ post.title }}
          </h2>
          <div class="flex items-center gap-[12px] flex-wrap">
            <TagChip v-for="tag in post.tags" :key="tag">{{ tag }}</TagChip>
            <div
              aria-hidden="true"
              :style="{ width: meterWidth(post.body) + 'px' }"
              class="h-[6px] bg-ink/15"
            />
          </div>
        </NuxtLink>

        <p v-if="visiblePosts.length === 0" class="font-mono text-[13px] opacity-50 py-[40px]">
          no posts with that tag
        </p>
      </div>

      <!-- Side column -->
      <div class="space-y-[48px]">
        <!-- Pinned card: single latest pinned post -->
        <div v-if="featuredPost" class="border border-ink p-[18px]">
          <div class="font-mono text-[11px] opacity-50 mb-[14px] uppercase tracking-wider">pinned</div>
          <div class="font-mono text-[12px] opacity-55 mb-[8px]">{{ formatDate(featuredPost.date) }}</div>
          <h3 class="font-mincho text-[20px] leading-[1.25] mb-[12px]">{{ featuredPost.title }}</h3>
          <div class="space-y-[4px] mb-[16px]">
            <div aria-hidden="true" class="h-[6px] bg-ink/15 w-full" />
            <div aria-hidden="true" class="h-[6px] bg-ink/15 w-[80%]" />
          </div>
          <NuxtLink :to="featuredPost.path" class="font-mono text-[12px] hover:opacity-70 transition-opacity">read →</NuxtLink>
        </div>

        <!-- Archive inline year counts -->
        <div v-if="yearCounts.length">
          <div class="font-mono text-[11px] opacity-50 mb-[14px] uppercase tracking-wider">archive · by year</div>
          <div class="flex gap-[16px] flex-wrap font-mono text-[12px]">
            <span v-for="{ year, count } in yearCounts" :key="year" class="opacity-70">
              {{ year }} ({{ count }})
            </span>
          </div>
        </div>

        <!-- RSS link -->
        <div>
          <a
            href="/rss.xml"
            class="inline-flex items-center gap-[8px] font-mono text-[12px] opacity-50 hover:opacity-80 transition-opacity"
          >
            <Rss :size="14" :stroke-width="2" />
            rss · /feed.xml
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Rss } from '@lucide/vue'

const { data: posts } = await useAsyncData('blog-list', () =>
  queryCollection('blog').order('date', 'DESC').all()
)

const tags = ['all', 'css', 'type', 'craft', 'motion', 'meta'] as const
type Tag = (typeof tags)[number]
const activeTag = ref<Tag>('all')

const visiblePosts = computed(() => {
  if (!posts.value) return []
  if (activeTag.value === 'all') return posts.value
  return posts.value.filter((p) => p.tags?.includes(activeTag.value))
})

const featuredPost = computed(() => posts.value?.find((p) => p.pinned) ?? null)

const postsByYear = computed(() => {
  if (!posts.value) return {} as Record<number, typeof posts.value>
  return posts.value.reduce(
    (acc, post) => {
      const year = new Date(post.date).getFullYear()
      if (!acc[year]) acc[year] = []
      acc[year].push(post)
      return acc
    },
    {} as Record<number, typeof posts.value>,
  )
})

const sortedYears = computed(() =>
  Object.keys(postsByYear.value)
    .map(Number)
    .sort((a, b) => b - a),
)

const yearCounts = computed(() =>
  sortedYears.value.map((year) => ({ year, count: postsByYear.value[year].length })),
)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${day}`
}

function meterWidth(body: string | object): number {
  return Math.min(useReadingTime(body) * 30, 240)
}

definePageMeta({ layout: 'content' })
</script>
