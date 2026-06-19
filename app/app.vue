<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Mounted here (not in a layout) so search works on every page regardless
       of whether it uses the default or content layout. -->
  <SearchModal v-model="searchOpen" />
</template>

<script setup lang="ts">
useHead({
  meta: [
    { property: 'og:image', content: '/og-default.png' },
    { property: 'og:title', content: "Grayson's Portfolio" },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { property: 'og:url', content: 'https://grayson512portfolio.dpdns.org' },
  ],
  // webmention.io endpoints — register domain at https://webmention.io first.
  // rel="me" → GitHub lets webmention.io verify domain ownership via IndieAuth
  // (GitHub profile's Website field must link back to this domain).
  link: [
    { rel: 'me', href: 'https://github.com/GavinLin512' },
    { rel: 'webmention', href: 'https://webmention.io/grayson512portfolio.dpdns.org/webmention' },
    { rel: 'pingback', href: 'https://webmention.io/grayson512portfolio.dpdns.org/xmlrpc' },
  ],
})

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
