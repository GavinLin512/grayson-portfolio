<script setup lang="ts">
interface Author {
  name?: string
  photo?: string
  url?: string
}

interface Mention {
  type: string
  source: string
  author?: Author
  text?: string
  'wm-received'?: string
}

const props = defineProps<{ target: string }>()

const { data: mentions } = useFetch<Mention[]>('/api/webmentions', {
  query: { target: props.target },
  default: () => [],
  server: false,
})
</script>

<template>
  <div v-if="mentions && mentions.length" class="flex flex-col gap-[24px]">
    <div
      v-for="mention in mentions"
      :key="mention.source"
      class="flex gap-3"
    >
      <img
        v-if="mention.author?.photo"
        :src="mention.author.photo"
        :alt="mention.author.name ?? 'author'"
        class="w-8 h-8 rounded-full shrink-0 mt-0.5"
      />
      <div
        v-else
        class="w-8 h-8 rounded-full shrink-0 mt-0.5 bg-ink/10 flex items-center justify-center font-mono text-[11px] opacity-60"
      >
        ?
      </div>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="font-mono text-[11px]">{{ mention.author?.name ?? 'anonymous' }}</span>
          <a
            :href="mention.source"
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-[11px] opacity-40 hover:opacity-70 transition-opacity truncate max-w-[240px]"
          >
            {{ mention.source }}
          </a>
        </div>
        <p
          v-if="mention.text"
          class="font-mono text-[12px] opacity-70 line-clamp-3"
        >
          {{ mention.text }}
        </p>
      </div>
    </div>
  </div>
</template>
