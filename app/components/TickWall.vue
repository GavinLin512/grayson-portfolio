<template>
  <div class="flex flex-col" :style="{ gap: `${gap}px` }">
    <div
      v-for="i in count"
      :key="i"
      :style="{
        width: `${i % 3 === 0 ? length - 14 : length}px`,
        borderTop: '0.7px solid var(--ink)',
        opacity: '0.7',
      }"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  count?: number
  length?: number
  gap?: number
}>(), {
  count: 5,
  length: 56,
  gap: 16,
})
</script>
