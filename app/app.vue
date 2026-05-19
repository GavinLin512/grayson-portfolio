<template>
  <div class="bg-bg text-ink min-h-screen p-8">
    <div class="font-mincho text-4xl mb-6">Test</div>
    <button
      class="font-mono text-sm border border-line px-4 py-2"
      @click="toggleDark"
    >
      Toggle dark mode (current: {{ colorMode.preference }})
    </button>
    <div class="relative h-[400px] w-full mt-8 border border-line">
      <PhiLines
        :lines="[
          { x1: 0, y1: '38.2%', x2: '100%', y2: '38.2%', width: 1 },
          { x1: '61.8%', y1: '10%', x2: '61.8%', y2: '90%', width: 0.5, opacity: 0.4 },
        ]"
        :dot="{ cx: '61.8%', cy: '38.2%' }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

function toggleDark() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>
