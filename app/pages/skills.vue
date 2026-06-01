<template>
  <div class="relative h-full flex flex-col">
    <PhiLines
      :lines="[{ x1: 0, y1: '38.2%', x2: '100%', y2: '18%', width: 0.5, opacity: 0.45 }]"
    />

    <PageHeader label="— 05 / skills" />

    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
      <div v-for="cat in categories" :key="cat.key" class="flex flex-col">
        <p class="font-mono text-[11px] uppercase tracking-wider opacity-50 mb-3">
          {{ cat.label }}
        </p>
        <div class="flex flex-wrap gap-2">
          <TagChip
            v-for="skill in skills?.[cat.key]"
            :key="skill"
          >
            {{ skill }}
          </TagChip>
        </div>
        <p class="font-hand text-[15px] opacity-40 mt-auto pt-6">{{ cat.caveat }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: skills } = await useAsyncData('skills', () =>
  queryCollection('skills').first()
)

const categories = [
  { key: 'backend',  label: 'Backend',  caveat: '— what i reach for daily.' },
  { key: 'frontend', label: 'Frontend', caveat: '— my natural habitat.' },
  { key: 'devops',   label: 'DevOps',   caveat: '— keeping things running.' },
  { key: 'database', label: 'Database', caveat: '— where data lives.' },
] as const

definePageMeta({ layout: 'content' })
</script>
