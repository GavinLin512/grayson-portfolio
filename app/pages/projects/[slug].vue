<template>
  <div>
    <template v-if="post">
      <!-- 4.3 Header grid -->
      <div class="grid grid-cols-[70px_1fr_200px] gap-6 items-baseline mb-[24px]">
        <span class="font-mono text-[15px] opacity-55">
          {{ String(index + 1).padStart(2, '0') }}
        </span>
        <div>
          <div class="font-mincho font-extrabold text-[56px] leading-[1.05]">
            {{ post.title }}
          </div>
          <div class="font-mono text-[22px] opacity-60 mt-[8px]">
            {{ post.subtitle }}
          </div>
        </div>
        <div class="font-mono text-[13px] opacity-55 text-right">
          {{ post.year }} · case study
        </div>
      </div>

      <!-- 4.4 Horizontal rule -->
      <hr class="border-t border-[var(--ink)] mb-[40px]" />

      <!-- 4.5 Cover image -->
      <div class="w-full h-[420px] mb-[60px] overflow-hidden bg-[var(--paper)]">
        <img
          v-if="post.cover"
          :src="post.cover"
          :alt="post.title"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- 4.6 Role / brief grid -->
      <div class="grid grid-cols-[1fr_2fr] gap-[60px] mb-[60px]">
        <div class="font-mono text-[13px] space-y-[24px]">
          <div>
            <div class="opacity-50 uppercase tracking-[0.08em] text-[11px] mb-[6px]">Role</div>
            <div>{{ post.role }}</div>
          </div>
          <div>
            <div class="opacity-50 uppercase tracking-[0.08em] text-[11px] mb-[6px]">Team</div>
            <div>{{ post.team }}</div>
          </div>
          <div>
            <div class="opacity-50 uppercase tracking-[0.08em] text-[11px] mb-[10px]">Stack</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in post.stack"
                :key="tag"
                class="border border-[var(--ink)] px-[8px] py-[2px] opacity-70"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <div class="font-mono text-[14px] leading-[1.8] opacity-85 space-y-[20px]">
          <p v-for="(excerpt, i) in bodyExcerpts" :key="i">{{ excerpt }}</p>
        </div>
      </div>

      <!-- 4.7 Dual-image grid -->
      <div
        v-if="post.screens && post.screens.length >= 2"
        class="grid grid-cols-[2fr_1fr] gap-6 mb-[60px]"
      >
        <img
          :src="post.screens[0]"
          :alt="`${post.title} screen 1`"
          class="h-[300px] w-full object-cover"
        />
        <div class="h-[300px] bg-[var(--cool)]">
          <img
            :src="post.screens[1]"
            :alt="`${post.title} screen 2`"
            class="w-full h-full object-cover"
          />
        </div>
      </div>

      <!-- 4.8 Full markdown body -->
      <div class="prose prose-lg max-w-none mb-[80px]">
        <ContentRenderer :value="post" />
      </div>

      <!-- 4.9 Prev / Next nav -->
      <div class="flex justify-between items-center border-t border-[var(--line)] pt-[32px] font-mono text-[14px]">
        <NuxtLink
          v-if="prevProject"
          :to="prevProject.path"
          class="opacity-70 hover:opacity-100 transition-opacity"
        >
          ← {{ prevProject.title }}
        </NuxtLink>
        <span v-else />
        <NuxtLink
          to="/projects"
          class="opacity-50 hover:opacity-100 transition-opacity text-[12px] uppercase tracking-[0.08em]"
        >
          all projects
        </NuxtLink>
        <NuxtLink
          v-if="nextProject"
          :to="nextProject.path"
          class="opacity-70 hover:opacity-100 transition-opacity"
        >
          {{ nextProject.title }} →
        </NuxtLink>
        <span v-else />
      </div>
    </template>

    <div v-else class="font-mono opacity-50">Project not found.</div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeRouteUpdate } from 'vue-router'

// Scroll to top on route update
onBeforeRouteUpdate(() => {
  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' })
})

const route = useRoute()
const slug = route.params.slug as string
const path = `/projects/${slug}`

const { data: post } = await useAsyncData(`project-${slug}`, () =>
  queryCollection('projects').path(path).first()
)

const { data: allProjects } = await useAsyncData('projects-all', () =>
  queryCollection('projects').order('date', 'ASC').all()
)

const index = computed(() => {
  if (!allProjects.value || !post.value) return 0
  return allProjects.value.findIndex((p) => p.path === post.value!.path)
})

const prevProject = computed(() => {
  if (!allProjects.value || index.value <= 0) return null
  return allProjects.value[index.value - 1]
})

const nextProject = computed(() => {
  if (!allProjects.value || index.value >= allProjects.value.length - 1) return null
  return allProjects.value[index.value + 1]
})

// Extract plain-text paragraphs from Brief and Process sections for the sidebar
const bodyExcerpts = computed(() => {
  if (!post.value?.body) return []
  const nodes = (post.value.body as any)?.children ?? []
  const excerpts: string[] = []
  let inBriefOrProcess = false
  for (const node of nodes) {
    if (node.tag === 'h2') {
      const text = node.children?.[0]?.value ?? ''
      inBriefOrProcess = text === 'Brief' || text === 'Process'
      continue
    }
    if (inBriefOrProcess && node.tag === 'p') {
      const text = node.children?.map((c: any) => c.value ?? '').join('') ?? ''
      if (text) excerpts.push(text)
    }
  }
  return excerpts
})

definePageMeta({ layout: 'content' })
</script>
