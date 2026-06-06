<template>
  <header class="h-14 flex justify-between items-center px-7 border-b border-line bg-bg">
    <div class="flex items-center gap-3">
      <span class="font-mincho text-[18px] leading-none">◇</span>
      <span class="font-mono text-[14px] opacity-60">grayson / 2026</span>
    </div>

    <nav class="flex items-center gap-6">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="font-mono text-[14px] transition-opacity pb-px"
        :class="isActive(item.path) ? 'opacity-100 border-b border-ink' : 'opacity-60'"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="flex items-center gap-2">
      <TagChip>EN</TagChip>
      <TagChip :active="isDark" @click="toggleDark">
        {{ isDark ? '◑' : '◯' }}
      </TagChip>
      <button
        type="button"
        aria-label="Search"
        class="flex items-center gap-[6px] h-[30px] px-[10px] border border-ink rounded-md"
        @click="searchOpen = true"
      >
        <Search :size="13" />
        <span class="font-mono text-[13px]">search</span>
        <span class="inline-flex items-center gap-[2px]">
          <template v-if="isMac">
            <kbd class="font-mono text-[11px] leading-none border border-ink/60 bg-paper rounded px-[5px] py-[2px]">⌘</kbd>
            <kbd class="font-mono text-[11px] leading-none border border-ink/60 bg-paper rounded px-[5px] py-[2px]">K</kbd>
          </template>
          <template v-else>
            <kbd class="font-mono text-[11px] leading-none border border-ink/60 bg-paper rounded px-[5px] py-[2px]">Ctrl</kbd>
            <kbd class="font-mono text-[11px] leading-none border border-ink/60 bg-paper rounded px-[5px] py-[2px]">K</kbd>
          </template>
        </span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Search } from '@lucide/vue'

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

const isDark = computed(() => colorMode.preference === 'dark')

function toggleDark() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const navItems = [
  { label: 'index',    path: '/' },
  { label: 'projects', path: '/projects' },
  { label: 'journal',  path: '/blog' },
  { label: 'about',    path: '/about' },
  { label: 'skills',   path: '/skills' },
  { label: 'journey',  path: '/journey' },
  { label: 'contact',  path: '/contact' },
]

function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>
