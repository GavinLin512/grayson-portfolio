<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    fill="none"
    stroke="var(--ink)"
    stroke-width="1.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  >
    <!-- a quill in pen line, drawn along +x from the nib tip and leaned 45°
         so the tip lands on (6, 94) with the feather up to the right; only
         the nib is filled, with the selected ink -->
    <g transform="translate(6 94) rotate(-45)">
      <!-- vane outline, wider above the shaft, with a split in it -->
      <path d="M42 -2.4 C 52 -10 64 -15.5 76 -17 L80 -12.5 L84 -18.2 C 98 -19.5 114 -15 122 -8 Q 126 -4 127 -1 C 124 4 110 9.5 94 10.5 C 76 11.5 56 8 44 2.6 Z" />
      <!-- rachis and sparse barb hatching -->
      <path d="M44 0 C 70 -0.4 100 -1 125 -1.4" stroke-width="1.1" />
      <path
        d="M50 -0.1 L58 -7.7 M58 -0.2 L66 -9.5 M66 -0.4 L74 -10.8 M74 -0.5 L82 -9.8 M88 -0.8 L96 -13.3 M96 -0.9 L104 -13.3 M104 -1 L112 -11.5 M112 -1.2 L120 -8 M52 -0.1 L59 6 M60 -0.3 L67 7.2 M68 -0.4 L75 8 M76 -0.6 L83 7.9 M84 -0.7 L91 7.6 M92 -0.8 L99 7.2 M100 -1 L107 6.8 M108 -1.1 L115 5.3"
        stroke-width="0.75"
        stroke-opacity="0.6"
      />
      <!-- loose down at the foot of the vane -->
      <path d="M42 -2 C 38 -5 35 -6 31 -6.6 M43 2 C 39 4.6 36 5.6 32 6" stroke-width="0.9" />
      <!-- bare barrel -->
      <path d="M20 -3.8 L44 -2.8 L44 2.8 L20 3.8 Z" stroke-width="1.2" />
      <!-- cut nib, tinted with the selected ink, and its slit -->
      <path d="M0 0 C 4 -1.6 11 -3.6 20 -3.8 L20 3.8 C 11 3.6 4 1.6 0 0 Z" :fill="nib" fill-opacity="0.95" stroke-width="1.2" />
      <path d="M1.5 0 L12 0" stroke="var(--paper)" stroke-width="0.9" />
    </g>
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
