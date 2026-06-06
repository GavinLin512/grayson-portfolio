<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[100] bg-ink/30"
      @click.self="close"
    >
      <dialog
        :open="modelValue"
        class="fixed inset-x-0 top-[15vh] mx-auto w-[90vw] max-w-2xl bg-bg text-ink border border-ink p-6"
      >
        <input
          ref="inputEl"
          v-model="query"
          type="text"
          placeholder="search posts & projects…"
          class="w-full h-[38px] bg-paper border border-ink px-3 font-mono text-[13px] outline-none"
        />

        <p v-if="unavailable" class="font-mono text-[12px] opacity-60 mt-5 leading-[1.6]">
          Search index not built. Run <code class="border border-line px-1">pnpm build</code> to enable search.
        </p>

        <ul v-else class="mt-4 max-h-[50vh] overflow-y-auto">
          <li v-for="r in results" :key="r.url">
            <button
              type="button"
              class="group block w-full text-left border-b border-line py-[18px] hover:opacity-80 transition-opacity"
              @click="go(r.url)"
            >
              <h3 class="font-mincho text-[18px] leading-[1.25] mb-[6px]">{{ r.title }}</h3>
              <!-- excerpt is Pagefind-generated from our own indexed pages (contains <mark> highlights) -->
              <p class="font-mono text-[12px] opacity-55 leading-[1.5]" v-html="r.excerpt" />
            </button>
          </li>
          <li
            v-if="query.trim() && !results.length && !loading"
            class="font-mono text-[12px] opacity-50 py-[20px]"
          >
            no matches for "{{ query }}"
          </li>
        </ul>
      </dialog>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { initPagefind, type PagefindResult } from '~/composables/usePagefind'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const query = ref('')
const results = ref<{ url: string, title: string, excerpt: string }[]>([])
const loading = ref(false)
const unavailable = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

let pf: Awaited<ReturnType<typeof initPagefind>> = null
let debounceTimer: ReturnType<typeof setTimeout> | undefined

function close() {
  emit('update:modelValue', false)
}

watch(() => props.modelValue, async (open) => {
  if (!open) return
  pf = await initPagefind()
  unavailable.value = pf === null
  await nextTick()
  inputEl.value?.focus()
})

watch(query, (q) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => runSearch(q), 200)
})

async function runSearch(q: string) {
  if (!pf || !q.trim()) {
    results.value = []
    return
  }
  loading.value = true
  const { results: hits } = await pf.search(q)
  const docs: PagefindResult[] = await Promise.all(hits.slice(0, 8).map(h => h.data()))
  results.value = docs.map(d => ({
    url: d.url,
    title: d.meta?.title ?? d.url,
    excerpt: d.excerpt,
  }))
  loading.value = false
}

function go(url: string) {
  close()
  navigateTo(url)
}
</script>
