<template>
  <span class="inline-flex gap-[3px]" role="img" :aria-label="`${level} of 5`">
    <span
      v-for="n in 5"
      :key="n"
      class="w-[8px] h-[8px]"
      :class="n <= level ? 'bg-ink' : 'border border-ink'"
    />
  </span>
</template>

<script setup lang="ts">
defineProps<{
  level: number
}>()
</script>
