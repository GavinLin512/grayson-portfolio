<script setup lang="ts">
interface CommentEntry {
  id: number
  github_id: string
  name: string
  avatar: string | null
  message: string
  created_at: number
}

interface SessionUser {
  id: number
  login: string
  avatar: string
}

const props = defineProps<{ slug?: string }>()

const listUrl = computed(() =>
  props.slug ? `/api/comments?slug=${encodeURIComponent(props.slug)}` : '/api/guestbook',
)
const postUrl = computed(() => (props.slug ? '/api/comments' : '/api/guestbook'))

const { user, clear: clearSession } = useUserSession()
const route = useRoute()
const loginUrl = computed(() => `/auth/login?redirect=${encodeURIComponent(route.path)}`)
const currentUser = computed(() => user.value as SessionUser | undefined)

const { data: entries, refresh } = useFetch<CommentEntry[]>(listUrl, {
  default: () => [],
  server: false,
})

const msg = ref('')
const submitting = ref(false)

async function submit() {
  if (!msg.value.trim() || submitting.value) return
  submitting.value = true
  try {
    const body: Record<string, string> = { message: msg.value.trim() }
    if (props.slug) body.slug = props.slug
    await $fetch(postUrl.value, { method: 'POST', body })
    msg.value = ''
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="flex flex-col">
    <div class="mb-[48px]">
      <ClientOnly>
        <a
          v-if="!currentUser"
          :href="loginUrl"
          class="border border-ink px-4 py-2 inline-block font-mono text-[12px]"
        >
          Sign in with GitHub →
        </a>
        <template v-else>
          <div class="flex items-center gap-3 mb-[20px]">
            <img
              :src="currentUser.avatar"
              :alt="currentUser.login"
              class="w-8 h-8 rounded-full"
            />
            <span class="font-mono text-[12px] opacity-70">{{ currentUser.login }}</span>
            <button
              type="button"
              class="font-mono text-[11px] opacity-40 hover:opacity-60 transition-opacity"
              @click="clearSession"
            >
              sign out
            </button>
          </div>
          <div class="flex flex-col gap-3">
            <textarea
              v-model="msg"
              maxlength="500"
              rows="3"
              :placeholder="slug ? 'Leave a comment…' : 'Leave a message…'"
              class="w-full max-w-[480px] font-mono text-[13px] bg-transparent border border-ink/40 rounded px-3 py-2 resize-none focus:outline-none focus:border-ink"
            />
            <div class="flex items-center gap-4">
              <button
                type="button"
                :disabled="!msg.trim() || submitting"
                class="border border-ink px-4 py-2 font-mono text-[12px] disabled:opacity-30"
                @click="submit"
              >
                {{ submitting ? 'Sending…' : 'Send →' }}
              </button>
              <span class="font-mono text-[11px] opacity-30">{{ msg.length }}/500</span>
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>

    <div v-if="entries && entries.length" class="flex flex-col gap-[32px]">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="flex gap-3"
      >
        <img
          v-if="entry.avatar"
          :src="entry.avatar"
          :alt="entry.name"
          class="w-8 h-8 rounded-full shrink-0 mt-0.5"
        />
        <div
          v-else
          class="w-8 h-8 rounded-full shrink-0 mt-0.5 bg-ink/10 flex items-center justify-center font-mono text-[11px] opacity-60"
        >
          {{ entry.name.charAt(0).toUpperCase() }}
        </div>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-3">
            <span class="font-mono text-[11px]">{{ entry.name }}</span>
            <span class="font-mono text-[11px] opacity-40">{{ formatDate(entry.created_at) }}</span>
          </div>
          <p class="font-mono text-[12px] opacity-80 whitespace-pre-wrap">{{ entry.message }}</p>
        </div>
      </div>
    </div>

    <p
      v-else
      class="font-mono text-[12px] opacity-40"
    >
      {{ slug ? 'No comments yet.' : 'No messages yet.' }}
    </p>
  </div>
</template>
