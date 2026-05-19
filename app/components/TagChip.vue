<template>
  <span
    class="inline-block font-mono text-[10px] border border-ink px-[10px] py-[3px] rounded-full cursor-pointer select-none transition-colors"
    :class="active ? 'bg-ink text-bg' : 'text-ink'"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  active?: boolean
}>(), {
  active: false,
})
</script>
