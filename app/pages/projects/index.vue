<template>
  <div class="relative min-h-full flex flex-col overflow-hidden">

    <!-- Header -->
    <PageHeader :label="`— 02 / projects · ${visibleProjects.length} selected`">
      <div class="flex gap-6 font-mono text-[13px]">
        <button
          v-for="cat in categories"
          :key="cat"
          class="transition-opacity"
          :class="
            activeCategory === cat
              ? 'opacity-100 underline font-bold'
              : 'opacity-60 hover:opacity-100'
          "
          @click="setCategory(cat)"
        >
          {{ cat }}
        </button>
      </div>
    </PageHeader>

    <!-- Two-column layout -->
    <div class="flex-1 overflow-hidden lg:grid lg:grid-cols-[3fr_2fr] lg:gap-12">
      <!-- Left: project list -->
      <div class="overflow-y-auto">
        <NuxtLink
          v-for="(project, i) in visibleProjects"
          :key="project.path"
          :to="project.path"
          class="group block border-b border-[var(--line)] py-5 px-3 cursor-pointer hover:bg-[var(--paper)] transition-[background-color] duration-200 ease-in-out"
          @mouseenter="selectedProject = project"
        >
          <div class="grid grid-cols-[40px_60px_1fr_120px] gap-4 items-start transition-transform duration-200 ease-in-out group-hover:translate-x-2">
            <!-- Col 1: zero-padded index -->
            <span class="font-mono text-[13px] opacity-55 pt-[10px]">
              {{ String(i + 1).padStart(2, '0') }}
            </span>

            <!-- Col 2: year -->
            <span class="font-mono text-[13px] opacity-55 pt-[10px]">
              {{ project.year }}
            </span>

            <!-- Col 3: title + subtitle -->
            <div>
              <div class="font-mincho text-[32px] leading-[1.1]">
                {{ project.title }}
              </div>
              <div class="font-mono text-[13px] opacity-60 mt-[4px]">
                {{ project.subtitle }}
              </div>
            </div>

            <!-- Col 4: category label -->
            <div class="font-mono text-[11px] opacity-60 text-right pt-[10px]">
              {{ project.category }}
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Right: preview panel (lg+ only) -->
      <div class="hidden lg:block">
        <div class="sticky">
          <p class="font-mono text-[11px] opacity-50 mb-4">preview · hover</p>

          <!-- Stripe placeholder with centered chip -->
          <div class="relative" style="aspect-ratio: 4/3; overflow: hidden;">
            <div
              class="absolute inset-0"
              style="background: repeating-linear-gradient(45deg, var(--ink) 0 1px, transparent 1px 8px); opacity: 0.12;"
            ></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div
                v-if="selectedProject"
                class="bg-white border border-[var(--ink)] px-3 py-1 font-mono text-[13px]"
              >
                {{ String(selectedIndex + 1).padStart(2, '0') }} — {{ selectedProject.title }}
              </div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="selectedProject" class="mt-4">
            <p class="font-mono text-[13px] opacity-70 leading-relaxed">
              {{ selectedProject.subtitle }}
            </p>
          </div>

          <!-- Tech tag pills -->
          <div v-if="selectedProject?.stack?.length" class="flex flex-wrap gap-2 mt-3">
            <span
              v-for="tag in selectedProject.stack"
              :key="tag"
              class="font-mono text-[11px] border border-[var(--ink)] px-[8px] py-[2px] rounded-full opacity-70"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: projects } = await useAsyncData('projects-list', () =>
  queryCollection('projects').order('date', 'ASC').all()
)

const categories = ['all', 'product', 'system', 'side'] as const
type Category = (typeof categories)[number]

const activeCategory = ref<Category>('all')
const selectedProject = ref(projects.value?.[0] ?? null)

const visibleProjects = computed(() => {
  if (!projects.value) return []
  if (activeCategory.value === 'all') return projects.value
  return projects.value.filter((p) => p.category === activeCategory.value)
})

const selectedIndex = computed(() =>
  selectedProject.value ? visibleProjects.value.indexOf(selectedProject.value) : 0
)

function setCategory(cat: Category) {
  activeCategory.value = cat
  if (
    selectedProject.value &&
    !visibleProjects.value.includes(selectedProject.value)
  ) {
    selectedProject.value = visibleProjects.value[0] ?? null
  }
}

definePageMeta({ layout: 'content' })
</script>
