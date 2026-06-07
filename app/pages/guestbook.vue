<script setup lang="ts">
definePageMeta({ layout: 'content' })
</script>

<template>
  <div class="relative min-h-full flex flex-col">
    <PageHeader label="— 09 / guestbook" />
    <div class="flex-1">
      <Comments />
    </div>
  </div>
</template>
