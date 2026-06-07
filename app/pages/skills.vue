<template>
  <div class="relative min-h-full flex flex-col">
    <PageHeader :label="`— 05 / ${skills?.header ?? 'skills'}`" />

    <div class="flex-1 flex flex-col">
      <!-- staggered category columns -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-10">
        <div
          v-for="(cat, i) in skills?.categories"
          :key="cat.label"
          class="flex flex-col"
          :class="offsets[i]"
        >
          <p class="font-mono text-[11px] tracking-wider opacity-50">
            {{ cat.index }} / {{ cat.label }}
          </p>
          <div class="border-t border-line mt-[12px]" />

          <div
            v-for="skill in cat.skills"
            :key="skill.name"
            class="flex items-center justify-between py-[11px] border-b border-dotted border-line"
          >
            <span class="font-mincho text-[18px] leading-none">{{ skill.name }}</span>
            <SkillMeter :level="skill.level" />
          </div>
        </div>
      </div>

      <!-- bottom annotations -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mt-auto pt-[48px]">
        <div class="lg:col-span-2">
          <p class="font-mono text-[11px] tracking-wider opacity-50 mb-2">currently learning</p>
          <p class="font-hand text-[19px] opacity-80">{{ skills?.currentlyLearning }}</p>
        </div>
        <div class="lg:col-span-2">
          <p class="font-mono text-[11px] tracking-wider opacity-50 mb-2">not interested in</p>
          <p class="font-hand text-[19px] opacity-80">{{ skills?.notInterested }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: skills } = await useAsyncData('skills', () =>
  queryCollection('skills').first()
)

// staggered vertical offsets per column to match uiux-fix/skills.png
// (lg+ only; columns align on md / mobile). column 2 sits lowest.
const offsets = ['lg:mt-0', 'lg:mt-10', 'lg:mt-3', 'lg:mt-6'] as const

definePageMeta({ layout: 'content' })
</script>
