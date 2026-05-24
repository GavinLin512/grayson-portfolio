<template>
  <div class="relative min-h-screen px-6 lg:px-[60px] py-[60px]">
    <PhiLines
      :lines="[{ x1: 0, y1: '61.8%', x2: '100%', y2: '61.8%', width: 0.6, opacity: 0.55 }]"
    />

    <p class="font-mono text-[15px] opacity-70 mb-[48px]">
      — 02 / works · {{ projects.length }} projects
    </p>

    <div class="divide-y divide-[var(--line)]">
      <NuxtLink
        v-for="(project, i) in projects"
        :key="project._path"
        :to="project._path"
        class="grid grid-cols-[60px_1fr_240px_120px] gap-6 py-6 items-start hover:opacity-70 transition-opacity"
      >
        <span class="font-mono text-[15px] opacity-55 pt-[4px]">
          {{ String(i + 1).padStart(2, '0') }}
        </span>

        <div>
          <div class="font-mincho font-semibold text-[24px] leading-[1.2]">
            {{ project.title }}
          </div>
          <div class="font-mono text-[13px] opacity-60 mt-[4px]">
            {{ project.subtitle }}
          </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-[4px]">
          <span
            v-for="tag in project.stack"
            :key="tag"
            class="font-mono text-[11px] border border-[var(--ink)] px-[8px] py-[2px] opacity-70"
          >
            {{ tag }}
          </span>
        </div>

        <div class="font-mono text-[20px] text-right pt-[2px] opacity-70">
          →
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: projects } = await useAsyncData('projects-list', () =>
  queryCollection('projects').order('date', 'ASC').all()
)
</script>
