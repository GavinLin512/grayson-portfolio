<template>
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    style="position:absolute;inset:0;width:100%;height:100%"
  >
    <line
      v-for="(line, i) in lines"
      :key="i"
      :x1="line.x1"
      :y1="line.y1"
      :x2="line.x2"
      :y2="line.y2"
      stroke="var(--ink)"
      :stroke-width="line.width ?? 1"
      :stroke-opacity="line.opacity ?? 1"
    />
    <circle
      v-if="dot"
      :cx="dot.cx"
      :cy="dot.cy"
      :r="dot.r ?? 2"
      fill="var(--cool)"
    />
  </svg>
</template>

<script setup lang="ts">
interface Line {
  x1: number | string
  y1: number | string
  x2: number | string
  y2: number | string
  width?: number
  opacity?: number
}

interface Dot {
  cx: number | string
  cy: number | string
  r?: number
}

defineProps<{
  lines: Line[]
  dot?: Dot
}>()
</script>
