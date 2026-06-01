<template>
  <div v-if="language === 'mermaid'" ref="mermaidEl" class="mermaid-diagram my-[24px] overflow-x-auto" />
  <pre v-else :class="$props.class"><slot /></pre>
</template>

<script setup lang="ts">
const props = defineProps({
  code: { type: String, default: '' },
  language: { type: String, default: null },
  filename: { type: String, default: null },
  highlights: { type: Array as PropType<number[]>, default: () => [] },
  meta: { type: String, default: null },
  class: { type: String, default: null },
})

const mermaidEl = ref<HTMLElement | null>(null)

onMounted(async () => {
  if (props.language !== 'mermaid' || !mermaidEl.value) return
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
  const id = `mermaid-${Math.random().toString(36).slice(2)}`
  const { svg } = await mermaid.render(id, props.code)
  mermaidEl.value.innerHTML = svg
})
</script>

<style>
.mermaid-diagram svg {
  max-width: 100%;
  height: auto;
}
</style>
