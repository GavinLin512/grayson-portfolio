<script setup lang="ts">
definePageMeta({ layout: 'content' })
</script>

<template>
  <div class="relative min-h-full flex flex-col">
    <PageHeader label="— 09 / guestbook" />
    <div class="flex-1 lg:grid lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-16">
      <Comments />
      <PageSketch kind="guestbook" class="hidden lg:block self-start" />
    </div>
  </div>
</template>
