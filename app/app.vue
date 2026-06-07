<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Mounted here (not in a layout) so search works on every page regardless
       of whether it uses the default or content layout. -->
  <SearchModal v-model="searchOpen" />
</template>

<script setup lang="ts">
// Shared signal — SiteHeader's search button writes the same useState key.
const searchOpen = useState('search-open', () => false)

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchOpen.value = !searchOpen.value
  }
  else if (e.key === 'Escape' && searchOpen.value) {
    searchOpen.value = false
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>
