<template>
  <div class="relative h-full flex flex-col">
    <PageHeader label="— 07 / contact" />

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-[80px]">
      <!-- Left column: contact info -->
      <div class="space-y-[32px]">
        <div>
          <div class="font-mono text-[11px] opacity-60 mb-[6px] lowercase">email</div>
          <a
            :href="`mailto:${config.public.contactEmail}`"
            class="font-mono text-[12px] opacity-85 hover:opacity-100 transition-opacity"
          >
            {{ config.public.contactEmail }}
          </a>
        </div>
        <div>
          <div class="font-mono text-[11px] opacity-60 mb-[6px] lowercase">github</div>
          <a
            href="https://github.com/grayson"
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-[12px] opacity-85 hover:opacity-100 transition-opacity"
          >
            @grayson
          </a>
        </div>
        <div>
          <div class="font-mono text-[11px] opacity-60 mb-[6px] lowercase">location</div>
          <p class="font-mono text-[12px] opacity-85">taipei, taiwan</p>
        </div>
      </div>

      <!-- Right column: form or success -->
      <div>
        <p v-if="submitted" class="font-hand text-[20px] opacity-90">
          — thanks. i'll write back soon.
        </p>

        <form v-else @submit.prevent="handleSubmit" class="space-y-[20px]">
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
            <label class="font-mono text-[11px] opacity-60 lowercase block">message</label>
            <textarea
              v-model="form.message"
              name="message"
              required
              rows="6"
              class="w-full min-h-[120px] border border-ink bg-paper mt-[6px] px-3 py-2 font-mono text-[12px] resize-none outline-none focus:opacity-100"
            />
          </div>

          <!-- Cloudflare Turnstile widget (explicit render) -->
          <div ref="turnstileEl" class="cf-turnstile-box min-h-[65px]" />

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

          <button
            type="submit"
            :disabled="loading"
            class="font-mono text-[12px] border border-ink px-5 py-2 hover:bg-ink hover:text-bg transition-colors disabled:opacity-40"
          >
            {{ loading ? 'sending...' : 'send message →' }}
          </button>
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
        callback?: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
      }) => string
      getResponse: (widgetId?: string) => string
      reset: (widgetId?: string) => void
    }
  }
}

useHead({
  script: [
    {
      src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
      defer: true,
    },
  ],
})

const config = useRuntimeConfig()

const form = reactive({ name: '', email: '', message: '', honey: '' })
const submitted = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const turnstileEl = ref<HTMLElement | null>(null)
const turnstileToken = ref('')
let widgetId: string | undefined

onMounted(() => {
  // The Turnstile script loads with `defer`; poll until it's ready, then
  // explicitly render so SPA hydration timing can't skip the auto-scan.
  const start = Date.now()
  const timer = setInterval(() => {
    if (window.turnstile && turnstileEl.value) {
      clearInterval(timer)
      widgetId = window.turnstile.render(turnstileEl.value, {
        sitekey: config.public.turnstileSiteKey,
        callback: (token) => { turnstileToken.value = token },
        'error-callback': () => { turnstileToken.value = '' },
        'expired-callback': () => { turnstileToken.value = '' },
      })
    }
    else if (Date.now() - start > 10000) {
      clearInterval(timer) // give up after 10s
    }
  }, 100)
})

async function handleSubmit() {
  if (form.honey) return // honeypot triggered

  if (!turnstileToken.value) {
    errorMsg.value = 'please complete the verification.'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        message: form.message,
        turnstileToken: turnstileToken.value,
      },
    })
    submitted.value = true
  }
  catch (err: unknown) {
    const status = (err as any)?.statusCode ?? (err as any)?.response?.status
    if (status === 429) {
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
