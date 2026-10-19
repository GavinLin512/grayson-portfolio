<template>
  <div class="flex items-center gap-2 shrink-0">
    <TagChip v-if="en">EN</TagChip>
    <ClientOnly v-if="dark">
      <button type="button" class="inline-flex" aria-label="Toggle dark mode" @click="toggleDark">
        <TagChip active>{{ isDark ? '◑' : '◯' }}</TagChip>
      </button>
      <template #fallback>
        <TagChip active>◯</TagChip>
      </template>
    </ClientOnly>
    <button
      v-if="search"
      type="button"
      aria-label="Search"
      class="flex items-center justify-center w-10 h-10 border border-ink rounded-md"
      @click="searchOpen = true"
    >
      <Search :size="15" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Search } from '@lucide/vue'

defineProps<{
  en?: boolean
  dark?: boolean
  search?: boolean
}>()

const colorMode = useColorMode()
const searchOpen = useState('search-open', () => false)
const isDark = computed(() => colorMode.value === 'dark')

function toggleDark() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
