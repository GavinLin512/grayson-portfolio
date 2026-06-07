<template>
  <div class="relative h-full flex flex-col">
    <PageHeader label="— 07 / contact" />

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-[80px]">
      <!-- Left column: hero + contact info -->
      <div class="flex flex-col">
        <h1 class="font-mincho text-[40px] leading-[1.1]">
          say hello,<br />or send a postcard.
        </h1>

        <p class="font-mono text-[12px] leading-[1.6] opacity-70 mt-[22px]">
          i answer within a few days. for work,<br />
          tell me the shape of the problem.
        </p>

        <div class="border-t border-line mt-[40px] pt-[28px] space-y-[14px]">
          <div class="flex justify-between font-mono text-[12px]">
            <span class="opacity-60 lowercase">email</span>
            <a
              :href="`mailto:${config.public.contactEmail}`"
              class="opacity-85 hover:opacity-100 transition-opacity"
            >
              {{ config.public.contactEmail }}
            </a>
          </div>
          <div class="flex justify-between font-mono text-[12px]">
            <span class="opacity-60 lowercase">github</span>
            <a
              href="https://github.com/grayson"
              target="_blank"
              rel="noopener noreferrer"
              class="opacity-85 hover:opacity-100 transition-opacity"
            >
              @grayson
            </a>
          </div>
          <div class="flex justify-between font-mono text-[12px]">
            <span class="opacity-60 lowercase">read.cv</span>
            <a
              href="https://read.cv/grayson"
              target="_blank"
              rel="noopener noreferrer"
              class="opacity-85 hover:opacity-100 transition-opacity"
            >
              /grayson
            </a>
          </div>
          <div class="flex justify-between font-mono text-[12px]">
            <span class="opacity-60 lowercase">location</span>
            <span class="opacity-85">taipei · GMT+8</span>
          </div>
        </div>
      </div>

      <!-- Right column: form or success -->
      <div class="flex flex-col h-full">
        <p v-if="submitted" class="font-hand text-[20px] opacity-90">
          — thanks. i'll write back soon.
        </p>

        <form v-else @submit.prevent="handleSubmit" class="flex flex-col h-full gap-[20px]">
          <div>
            <label class="font-mono text-[11px] opacity-60 lowercase block">name</label>
            <input
              v-model="form.name"
              name="name"
              required
              autocomplete="name"
              class="w-full h-[38px] border border-ink bg-paper mt-[6px] px-3 font-mono text-[12px] outline-none focus:opacity-100"
            />
          </div>

          <div>
            <label class="font-mono text-[11px] opacity-60 lowercase block">email</label>
            <input
              v-model="form.email"
              name="email"
              type="email"
              required
              autocomplete="email"
              class="w-full h-[38px] border border-ink bg-paper mt-[6px] px-3 font-mono text-[12px] outline-none focus:opacity-100"
            />
          </div>

          <div>
            <label class="font-mono text-[11px] opacity-60 lowercase block">what kind of message?</label>
            <div class="flex gap-[8px] mt-[10px]">
              <button
                v-for="t in topics"
                :key="t"
                type="button"
                @click="form.topic = t"
                :class="form.topic === t ? 'bg-ink text-bg' : 'border border-ink'"
                class="font-mono text-[12px] px-[14px] py-[5px] rounded-full transition-colors"
              >
                {{ t }}
              </button>
            </div>
          </div>

          <div class="flex-1 flex flex-col min-h-0">
            <label class="font-mono text-[11px] opacity-60 lowercase block">message</label>
            <textarea
              v-model="form.message"
              name="message"
              required
              class="flex-1 w-full min-h-[120px] border border-ink bg-paper mt-[6px] px-3 py-2 font-mono text-[12px] resize-none outline-none focus:opacity-100"
            />
          </div>

          <!-- Cloudflare Turnstile (invisible; explicit render). Stable class
               kept so Argos can mask any challenge iframe; no min-h because the
               widget takes no inline space in invisible mode. -->
          <div ref="turnstileEl" class="cf-turnstile-box" />

          <!-- Honeypot: bots fill this, humans don't -->
          <input
            v-model="form.honey"
            name="contact_url"
            type="text"
            class="hidden"
            tabindex="-1"
            autocomplete="off"
            aria-hidden="true"
          />

          <p v-if="errorMsg" class="font-mono text-[12px] opacity-80">{{ errorMsg }}</p>

          <div class="flex items-center justify-between">
            <span class="font-mono text-[12px] opacity-50">· protected by friendliness, not captcha</span>
            <button
              type="submit"
              :disabled="loading"
              class="font-mono text-[12px] bg-ink text-bg px-5 py-2 hover:opacity-85 transition-opacity disabled:opacity-40"
            >
              {{ loading ? (turnstileToken ? 'sending...' : 'verifying...') : 'send →' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: {
        sitekey: string
        execution?: 'render' | 'execute'
        appearance?: 'always' | 'execute' | 'interaction-only'
        callback?: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
        'timeout-callback'?: () => void
      }) => string
      getResponse: (widgetId?: string) => string
      reset: (widgetId?: string) => void
      execute: (widgetId?: string | HTMLElement) => void
    }
    onTurnstileLoad?: () => void
  }
}

useHead({
  script: [
    {
      // `render=explicit`: we render manually; `onload` fires window.onTurnstileLoad
      // once the API is ready, replacing the old polling loop.
      src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad',
      defer: true,
    },
  ],
})

const config = useRuntimeConfig()

const topics = ['work', 'hello', 'speaking', 'other'] as const
type Topic = (typeof topics)[number]

const form = reactive({ name: '', email: '', topic: 'work' as Topic, message: '', honey: '' })
const submitted = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const turnstileEl = ref<HTMLElement | null>(null)
const turnstileToken = ref('')
let widgetId: string | undefined

// Callbacks waiting for the next invisible-verification token. When a submit
// happens before a token exists, we park its resolver here and fulfil it from
// the widget callback, so the user never gets a dead-end "please verify" error.
let tokenWaiters: Array<(token: string) => void> = []

function fulfilToken(token: string) {
  turnstileToken.value = token
  tokenWaiters.forEach(resolve => resolve(token))
  tokenWaiters = []
}

function renderTurnstile() {
  if (!window.turnstile || !turnstileEl.value || widgetId !== undefined) return
  widgetId = window.turnstile.render(turnstileEl.value, {
    sitekey: config.public.turnstileSiteKey,
    // Defer the challenge until we call execute() on submit — keeps the token
    // fresh (it only lives 300s) and avoids profiling every page visitor.
    execution: 'execute',
    appearance: 'execute',
    callback: (token) => { fulfilToken(token) },
    'error-callback': () => { turnstileToken.value = '' },
    'expired-callback': () => { turnstileToken.value = '' },
    'timeout-callback': () => { turnstileToken.value = '' },
  })
}

onMounted(() => {
  // First load: the deferred script calls window.onTurnstileLoad when ready.
  // SPA re-navigation: the API is already present, so render immediately.
  window.onTurnstileLoad = renderTurnstile
  if (window.turnstile) renderTurnstile()
})

// Resolve as soon as a fresh token is available. If none yet (slow network or
// expired), actively trigger invisible verification and wait — capped by a
// timeout so the UI never hangs forever.
function ensureToken(timeoutMs = 12000): Promise<string> {
  if (turnstileToken.value) return Promise.resolve(turnstileToken.value)

  return new Promise((resolve, reject) => {
    const onToken = (token: string) => { clearTimeout(timer); resolve(token) }
    tokenWaiters.push(onToken)

    const timer = setTimeout(() => {
      tokenWaiters = tokenWaiters.filter(w => w !== onToken)
      reject(new Error('verify-timeout'))
    }, timeoutMs)

    // Kick the invisible widget if it hasn't produced a token on its own.
    try {
      if (window.turnstile && widgetId !== undefined) window.turnstile.execute(widgetId)
    }
    catch { /* execute unsupported for this widget mode — rely on auto token */ }
  })
}

async function handleSubmit() {
  if (form.honey) return // honeypot triggered

  // Enter the busy state on click so the button reacts immediately, even while
  // invisible verification is still resolving in the background.
  loading.value = true
  errorMsg.value = ''

  try {
    const turnstileToken = await ensureToken()

    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        topic: form.topic,
        message: form.message,
        turnstileToken,
      },
    })
    submitted.value = true
  }
  catch (err: unknown) {
    const status = (err as any)?.statusCode ?? (err as any)?.response?.status
    if ((err as any)?.message === 'verify-timeout') {
      errorMsg.value = 'verification is taking too long — please try again.'
    }
    else if (status === 429) {
      errorMsg.value = 'too many messages — try again later.'
    }
    else if (status === 403) {
      errorMsg.value = 'verification failed — please refresh and try again.'
    }
    else {
      errorMsg.value = 'something went wrong — please try again.'
    }
    window.turnstile?.reset(widgetId)
    turnstileToken.value = ''
  }
  finally {
    loading.value = false
  }
}

definePageMeta({ layout: 'content' })
</script>
