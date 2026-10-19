<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    fill="none"
    stroke="var(--ink)"
    stroke-width="1.1"
    stroke-linejoin="round"
    stroke-linecap="round"
  >
    <!-- dark cigar barrel with rounded tail (pen leans 45°, tip at 6,94) -->
    <path
      d="M30.6 61.4 L61.3 31.9 Q66 27.4 69.3 30.6 Q72.5 33.9 68.1 38.7 L38.6 69.4 Z"
      fill="var(--ink)"
      fill-opacity="0.9"
    />
    <!-- pocket clip -->
    <path d="M62.8 27.9 Q60 28.7 58.6 31.2 L44.5 45.4" stroke="var(--paper)" stroke-width="1.4" />
    <!-- cap band -->
    <path d="M30.9 61.7 L38.4 69.2" stroke-width="0.9" />
    <!-- grip section -->
    <path d="M23.7 69.3 L30.7 76.3 L36.6 70.8 L29.2 63.4 Z" fill="var(--paper)" />
    <!-- large leaf-shaped nib with curved shoulders, tinted with the selected ink -->
    <path
      d="M6 94 Q7.5 83 14.4 74.2 Q18.3 70.7 23.7 69.3 L30.7 76.3 Q29.4 81.7 25.8 85.6 Q16.9 92.4 6 94 Z"
      :fill="nib"
      fill-opacity="0.95"
    />
    <!-- slit + breather hole -->
    <path d="M6 94 L13.4 86.6" stroke-width="1.1" />
    <circle cx="15.2" cy="84.8" r="2.6" fill="var(--paper)" />
  </svg>
</template>

<script setup lang="ts">
// Nib tip sits at (6, 94) in the 100-unit viewBox; align it to the pointer
// with offset (6, 94) * size / 100.
withDefaults(defineProps<{
  size?: number
  nib?: string
}>(), {
  size: 46,
  nib: 'var(--ink)',
})
</script>
