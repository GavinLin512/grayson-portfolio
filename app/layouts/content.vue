<template>
  <div class="bg-bg text-ink min-h-screen flex flex-col isolate">
    <BgLayer />
    <SiteHeader class="sticky top-0 z-10" />
    <main class="flex-1 p-6 lg:p-[60px]">
      <div :key="route.path" class="qc-fade h-full">
        <slot />
      </div>
    </main>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
