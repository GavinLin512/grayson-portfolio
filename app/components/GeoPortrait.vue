<template>
  <div
    class="relative overflow-hidden"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    <!-- Base bg -->
    <div class="absolute inset-0" style="background: var(--bg)" />
    <!-- Cool upper strip — φ⁻¹ of height -->
    <div
      class="absolute top-0 left-0 right-0"
      :style="{ height: `${height * 0.618}px`, background: 'var(--cool)' }"
    />
    <!-- Bg cutout top-left — φ⁻¹w × φ⁻²h -->
    <div
      class="absolute top-0 left-0"
      :style="{ width: `${width * 0.618}px`, height: `${height * 0.382}px`, background: 'var(--bg)' }"
    />
    <!-- Cool accent bottom-right — φ⁻²w × φ⁻²h -->
    <div
      class="absolute bottom-0 right-0"
      :style="{ width: `${width * 0.382}px`, height: `${height * 0.382}px`, background: 'var(--cool)' }"
    />
    <!-- Inner accent — φ³ subdivision -->
    <div
      class="absolute"
      :style="{
        left: `${width * 0.382}px`,
        top: `${height * 0.382}px`,
        width: `${width * 0.236}px`,
        height: `${height * 0.236}px`,
        background: 'var(--cool)',
      }"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  width?: number
  height?: number
}>(), {
  width: 400,
  height: 460,
})
</script>
