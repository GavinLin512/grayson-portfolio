<template>
  <!-- Below lg only; the desktop header/footer markup lives in SiteHeader /
       SiteFooter. Header: logo + search. Footer: a pinned bar (SiteFooter makes
       it sticky) that names the current page and carries a filled "menu" pill;
       tapping it lifts a table of contents with every page, EN, dark mode. -->
  <div v-if="part === 'header'" class="lg:hidden h-14 flex items-center justify-between gap-3 px-5">
    <span class="flex items-center gap-3 min-w-0">
      <span class="font-mincho text-20 leading-none">◇</span>
      <span class="font-mono text-14 opacity-60 truncate">grayson / 2026</span>
    </span>
    <MobileNavTools search />
  </div>

  <div v-else class="lg:hidden font-mono text-14 bg-paper pb-[env(safe-area-inset-bottom)]">
    <button
      type="button"
      class="w-full h-12 flex items-center justify-between gap-3 px-5"
      aria-controls="mobile-nav"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="flex items-center gap-2 min-w-0">
        <span class="w-[7px] h-[7px] rotate-45 bg-gold shrink-0" />
        <span class="truncate">{{ current?.label ?? 'grayson' }}</span>
      </span>
      <span class="flex items-center gap-2 shrink-0 px-[14px] py-[6px] rounded-full border border-ink bg-ink text-bg">
        <span>{{ open ? 'close' : 'menu' }}</span>
        <span class="inline-block text-12 transition-transform duration-300" :class="open ? 'rotate-180' : ''">
          <span class="mn-nudge inline-block">▴</span>
        </span>
      </span>
    </button>

    <Teleport to="body">
      <Transition name="mn">
        <div
          v-if="open"
          class="lg:hidden fixed inset-x-0 top-0 bottom-[calc(3rem+env(safe-area-inset-bottom))] z-40 text-ink flex flex-col justify-end"
        >
          <div class="absolute inset-0 bg-black opacity-30 dark:opacity-50" @click="close" />
          <div
            id="mobile-nav"
            role="dialog"
            aria-label="Contents"
            class="mn-panel relative bg-bg border-t border-line px-5 pt-5 pb-4 max-h-[75dvh] overflow-y-auto font-mono text-14"
          >
            <p class="text-12 opacity-50 mb-2">— contents</p>
            <ul>
              <li v-for="(item, i) in allNavItems" :key="item.path">
                <NuxtLink
                  :to="item.path"
                  class="flex items-center gap-2 py-[10px]"
                  :class="isActive(item.path) ? '' : 'opacity-70'"
                  :aria-current="isActive(item.path) ? 'page' : undefined"
                  @click="close"
                >
                  <span class="w-[7px] h-[7px] rotate-45 shrink-0" :class="isActive(item.path) ? 'bg-gold' : 'bg-transparent'" />
                  <span class="font-mincho text-20 leading-none">{{ item.label }}</span>
                  <span class="flex-1 self-end mb-[3px] border-b border-dotted border-ink opacity-30" />
                  <span class="text-12 opacity-60">{{ padNum(i + 1) }}</span>
                </NuxtLink>
              </li>
            </ul>
            <div class="mt-3 pt-4 border-t border-line flex items-center justify-between">
              <MobileNavTools en dark />
              <span class="text-12 opacity-50">a portfolio in beige</span>
            </div>
            <p class="mt-3 text-12 opacity-50">© 2026 — grayson · index 00</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { allNavItems, padNum } from '~/composables/useMobileNav'

defineProps<{ part: 'header' | 'footer' }>()

const { isActive, current } = useNavState()
const { open, toggle, close } = useDisclosure()
</script>

<style scoped>
.mn-enter-active,
.mn-leave-active {
  transition: opacity 0.28s ease;
}
.mn-enter-active .mn-panel,
.mn-leave-active .mn-panel {
  transition: transform 0.28s ease;
}
.mn-enter-from,
.mn-leave-to {
  opacity: 0;
}
.mn-enter-from .mn-panel,
.mn-leave-to .mn-panel {
  transform: translateY(10px);
}

/* the chevron drifts up a few times after load to say "tap me", then rests;
   `translate` composes with the rotate used when the sheet is open */
.mn-nudge {
  animation: mn-nudge 3.2s ease-in-out 1.2s 3;
}
@keyframes mn-nudge {
  50% {
    translate: 0 -3px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mn-enter-active,
  .mn-leave-active,
  .mn-enter-active .mn-panel,
  .mn-leave-active .mn-panel {
    transition: none;
  }
  .mn-nudge {
    animation: none;
  }
}
</style>
