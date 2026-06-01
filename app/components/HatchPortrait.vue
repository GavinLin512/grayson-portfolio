<template>
  <div
    class="relative border border-line"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      background:
        'repeating-linear-gradient(45deg, transparent 0, transparent 6px, var(--line) 6px, var(--line) 7px)',
    }"
  >
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-ink bg-bg px-[14px] py-[8px] font-mono text-[11px]"
    >
      {{ label }}
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number
  label?: string
}>(), {
  size: 320,
  label: 'portrait',
})
</script>
