<template>
  <div class="shrink-0 mb-[48px]">
    <div class="flex items-baseline justify-between">
      <p class="font-mono text-[15px] opacity-70">{{ label }}</p>
      <slot />
    </div>
    <div class="border-t border-line mt-[14px]" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>
