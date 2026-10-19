<template>
  <header class="lg:h-14 lg:flex lg:justify-between lg:items-center lg:px-7 border-b border-line bg-bg">
    <div class="hidden lg:flex items-center gap-3">
      <span class="font-mincho text-20 leading-none">◇</span>
      <span class="font-mono text-14 opacity-60">grayson / 2026</span>
    </div>

    <nav class="hidden lg:flex items-center gap-6">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="font-mono text-14 transition-opacity pb-px"
        :class="isActive(item.path) ? 'opacity-100 border-b border-ink' : 'opacity-60'"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="hidden lg:flex items-center gap-2">
      <TagChip>EN</TagChip>
      <ClientOnly>
        <TagChip active @click="toggleDark">
          {{ isDark ? '◑' : '◯' }}
        </TagChip>
        <template #fallback>
          <TagChip active>◯</TagChip>
        </template>
      </ClientOnly>
      <button
        type="button"
        aria-label="Search"
        class="flex items-center gap-[6px] h-[30px] px-[10px] border border-ink rounded-md"
        @click="searchOpen = true"
      >
        <Search :size="13" />
        <span class="font-mono text-12">search</span>
        <span class="inline-flex items-center gap-[2px]">
          <template v-if="isMac">
            <kbd class="font-mono text-12 leading-none border border-ink/60 bg-paper rounded px-[5px] py-[2px]">⌘</kbd>
            <kbd class="font-mono text-12 leading-none border border-ink/60 bg-paper rounded px-[5px] py-[2px]">K</kbd>
          </template>
          <template v-else>
            <kbd class="font-mono text-12 leading-none border border-ink/60 bg-paper rounded px-[5px] py-[2px]">Ctrl</kbd>
            <kbd class="font-mono text-12 leading-none border border-ink/60 bg-paper rounded px-[5px] py-[2px]">K</kbd>
          </template>
        </span>
      </button>
    </div>

    <MobileNav part="header" />
  </header>
</template>

<script setup lang="ts">
import { Search } from '@lucide/vue'
import { navItems } from '~/composables/useMobileNav'

const route = useRoute()
const colorMode = useColorMode()

// Shared signal with the app-root SearchModal (same useState key).
const searchOpen = useState('search-open', () => false)

// Show ⌘K on macOS, Ctrl K elsewhere. Defaults to mac for SSR/hydration, then
// corrects on the client after mount (no hydration mismatch — value only
// changes post-hydration).
const isMac = ref(true)
onMounted(() => {
  isMac.value = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
})

const isDark = computed(() => colorMode.value === 'dark')

function toggleDark() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>
