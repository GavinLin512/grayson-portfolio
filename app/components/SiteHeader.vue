<template>
  <header class="h-14 flex justify-between items-center px-7 border-b border-line bg-bg">
    <div class="flex items-center gap-3">
      <span class="font-mincho text-[18px] leading-none">◇</span>
      <span class="font-mono text-[10px] opacity-60">grayson / 2026</span>
    </div>

    <nav class="flex items-center gap-6">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="font-mono text-[10px] transition-opacity pb-px"
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
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()

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
