<template>
  <div class="relative h-full flex flex-col">
    <PageHeader label="— 06 / journey" />

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
      <!-- Left: Vertical timeline -->
      <div class="relative">
        <!-- φ spine at left edge of entries -->
        <div class="absolute top-0 bottom-0 border-l border-ink opacity-30" style="left: 8px;" />

        <div class="space-y-10 pl-7">
          <section
            v-for="entry in entries"
            :key="entry.year"
            :id="`year-${entry.year}`"
            class="relative"
          >
            <!-- Marker centered on spine -->
            <div class="absolute bg-ink w-[8px] h-[8px]" style="left: -31px; top: 4px;" />

            <!-- Year label -->
            <p class="font-mono text-[11px] tracking-wider opacity-60 uppercase">
              {{ yearLabel(entry) }}
            </p>

            <!-- Company · Role -->
            <h3 class="font-mincho text-[28px] leading-tight mt-1">
              {{ entry.company }} · {{ entry.role }}
            </h3>

            <!-- Description -->
            <p class="font-mono text-[12px] opacity-70 mt-1">
              {{ entry.description }}
            </p>

            <!-- Tags -->
            <div v-if="entry.tags?.length" class="flex flex-wrap gap-2 mt-3">
              <TagChip v-for="tag in entry.tags" :key="tag">{{ tag }}</TagChip>
            </div>
          </section>
        </div>
      </div>

      <!-- Right: Résumé card -->
      <div class="hidden lg:flex flex-col">
        <p class="font-mono text-[11px] opacity-60">résumé · cv</p>

        <div class="border border-ink mt-3 p-5">
          <div class="flex justify-between items-center font-mono text-[12px]">
            <span>grayson_lin · cv · 2026.pdf</span>
            <span class="opacity-50">178 kb</span>
          </div>

          <!-- PDF preview bars -->
          <div class="mt-4 space-y-[6px]">
            <div class="h-[6px] bg-ink opacity-20 w-[80%]" />
            <div class="h-[6px] bg-ink opacity-20 w-[65%]" />
            <div class="h-[6px] bg-ink opacity-20 w-[50%]" />
          </div>

          <div class="flex gap-3 mt-6">
            <a
              href="/resume.pdf"
              download
              class="font-mono text-[12px] bg-ink text-bg px-5 py-2 hover:opacity-80 transition-opacity"
            >
              ↓ download pdf
            </a>
            <a
              href="/resume.pdf"
              target="_blank"
              class="font-mono text-[12px] border border-ink px-5 py-2 hover:bg-ink hover:text-bg transition-colors"
            >
              preview
            </a>
          </div>
        </div>

        <p class="font-hand text-[17px] mt-5 opacity-80 leading-relaxed">
          also available — JSON résumé ↗<br />
          &amp; a one-page edition.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: timelineData } = await useAsyncData('timeline', () =>
  queryCollection('timeline').first()
)

const entries = computed(() => timelineData.value?.entries ?? [])

function yearLabel(entry: { year: number; yearEnd?: number }) {
  if (entry.yearEnd) return `${entry.year} → ${String(entry.yearEnd).slice(-2)}`
  return String(entry.year)
}

definePageMeta({ layout: 'content' })
</script>
