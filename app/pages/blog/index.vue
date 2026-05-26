<template>
  <div class="relative h-full flex flex-col">
    <PageHeader :label="`— 03 / journal · ${visiblePosts.length} notes`">
      <div class="flex gap-5 font-mono text-[13px] flex-wrap">
        <button
          v-for="tag in tags"
          :key="tag"
          class="transition-opacity"
          :class="activeTag === tag ? 'opacity-100 underline font-bold' : 'opacity-60 hover:opacity-100'"
          @click="activeTag = tag"
        >
          {{ tag }}
        </button>
      </div>
    </PageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[60px]">
      <!-- Main column: post list -->
      <div>
        <NuxtLink
          v-for="post in visiblePosts"
          :key="post.path"
          :to="post.path"
          class="group block border-b border-line py-[28px] transition-opacity hover:opacity-80"
        >
          <div class="flex items-center gap-[16px] font-mono text-[12px] opacity-55 mb-[10px]">
            <span>{{ formatDate(post.date) }}</span>
            <span>·</span>
            <span>{{ useReadingTime(post.body) }} min read</span>
          </div>
          <h2 class="font-mincho text-[24px] leading-[1.25] mb-[12px] group-hover:opacity-70 transition-opacity">
            {{ post.title }}
          </h2>
          <div class="flex gap-[8px] flex-wrap">
            <TagChip v-for="tag in post.tags" :key="tag">{{ tag }}</TagChip>
          </div>
        </NuxtLink>

        <p v-if="visiblePosts.length === 0" class="font-mono text-[13px] opacity-50 py-[40px]">
          no posts with that tag
        </p>
      </div>

      <!-- Side column -->
      <div class="space-y-[48px]">
        <!-- Pinned posts -->
        <div v-if="pinnedPosts.length" class="border border-ink p-[18px]">
          <div class="font-mono text-[11px] opacity-50 mb-[14px] uppercase tracking-wider">pinned</div>
          <div class="space-y-[12px]">
            <NuxtLink
              v-for="post in pinnedPosts"
              :key="post.path"
              :to="post.path"
              class="block font-mincho text-[16px] leading-[1.3] hover:opacity-70 transition-opacity"
            >
              {{ post.title }}
            </NuxtLink>
          </div>
        </div>

        <!-- Archive by year -->
        <div v-if="Object.keys(postsByYear).length">
          <div class="font-mono text-[11px] opacity-50 mb-[14px] uppercase tracking-wider">archive</div>
          <div class="space-y-[8px]">
            <div v-for="year in sortedYears" :key="year">
              <div class="font-mono text-[12px] opacity-40 mb-[4px]">{{ year }}</div>
              <div class="space-y-[4px] ml-[12px]">
                <NuxtLink
                  v-for="post in postsByYear[year]"
                  :key="post.path"
                  :to="post.path"
                  class="block font-mono text-[12px] opacity-70 hover:opacity-100 transition-opacity truncate"
                >
                  {{ post.title }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- RSS link -->
        <div>
          <a href="/rss.xml" class="font-mono text-[12px] opacity-50 hover:opacity-80 transition-opacity">
            rss · /rss.xml
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const pinnedPosts = computed(() => posts.value?.filter((p) => p.pinned) ?? [])

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

definePageMeta({ layout: 'content' })
</script>
