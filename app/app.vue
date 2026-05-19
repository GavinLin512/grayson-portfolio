<template>
  <div class="bg-bg text-ink min-h-screen p-8">
    <div class="font-mincho text-4xl mb-6">Test</div>
    <button
      class="font-mono text-sm border border-line px-4 py-2"
      @click="toggleDark"
    >
      Toggle dark mode (current: {{ colorMode.preference }})
    </button>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

function toggleDark() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>
