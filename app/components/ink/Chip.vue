<template>
  <!-- The palette: a small floating chip that shows the active ink by name. Click
       it to open a row of inks away from the screen edge; picking one collapses
       it again, and so does Esc or the first click elsewhere (which is also a
       stroke starting). Drag the dotted grip to put it anywhere: it snaps to the
       nearest side and remembers the spot; double-click the grip to send it back
       bottom-right. There is no visible cursor on this page, so the grip lights
       up on hover and the whole chip lifts while it is dragged. Pointer-only. -->
  <div
    ref="rootEl"
    class="ink-palette chip fixed z-[90]"
    :class="{ 'is-drag': dragging, 'is-right': pos.side === 'r', 'is-home': pos.y == null }"
    :style="rootStyle"
  >
    <div class="chip-pill font-mono text-14">
      <span
        class="chip-grip"
        role="presentation"
        title="drag to move · double-click to reset"
        @pointerdown="onGripDown"
        @pointermove="onGripMove"
        @pointerup="onGripUp"
        @pointercancel="onGripUp"
        @dblclick="goHome"
      />
      <button ref="mainEl" type="button" class="chip-main" :aria-expanded="open" aria-label="ink palette" @click="open = !open">
        <span v-if="eraser" class="chip-dot chip-dot-eraser" aria-hidden="true">
          <Eraser :size="14" />
        </span>
        <span v-else class="chip-dot" :style="{ background: `var(${token})` }" />
        <span class="chip-name">{{ activeName }}</span>
        <span class="chip-caret" aria-hidden="true">{{ caret }}</span>
      </button>
      <div class="chip-more" :class="{ 'is-open': open }">
        <div class="chip-grp" role="radiogroup" aria-label="ink or eraser">
          <button
            v-for="c in INK_COLORS"
            :key="c.token"
            type="button"
            role="radio"
            class="chip-sw"
            :class="{ 'is-active': !eraser && c.token === token }"
            :style="{ background: `var(${c.token})` }"
            :aria-checked="!eraser && c.token === token"
            :aria-label="c.name"
            :title="c.name"
            :tabindex="open ? 0 : -1"
            @click="pickInk(c.token, $event)"
          />
          <button
            type="button"
            role="radio"
            class="chip-sw chip-tool"
            :class="{ 'is-active': eraser }"
            :aria-checked="eraser"
            aria-label="eraser"
            title="eraser"
            :tabindex="open ? 0 : -1"
            @click="pickEraser($event)"
          >
            <Eraser :size="12" aria-hidden="true" />
          </button>
        </div>
        <button type="button" class="chip-sw chip-x" aria-label="clear all strokes" title="clear all" :tabindex="open ? 0 : -1" @click="clear">
          <svg width="8" height="8" viewBox="0 0 14 14" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" aria-hidden="true">
            <path d="M2 2 L12 12 M12 2 L2 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Eraser } from '@lucide/vue'
import { INK_COLORS } from '~/composables/useInk'

type Side = 'l' | 'r'

const { token, eraser, clear } = useInk()
const open = ref(false)
const dragging = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const mainEl = ref<HTMLElement | null>(null)
// y null = home (right edge, a little above the footer; placed by CSS)
const pos = ref<{ side: Side, y: number | null }>({ side: 'r', y: null })

const activeName = computed(() => eraser.value ? 'eraser' : INK_COLORS.find((c) => c.token === token.value)?.name ?? 'ink')
// the caret points where the row will open: away from the screen edge
const caret = computed(() => {
  const outward = pos.value.side === 'r' ? '‹' : '›'
  return open.value ? (outward === '‹' ? '›' : '‹') : outward
})
// inline style only once the chip was dragged
const rootStyle = computed(() => pos.value.y == null
  ? undefined
  : {
      [pos.value.side === 'l' ? 'left' : 'right']: '40px', // clears the index page frame (24px + scale ticks)
      top: `${pos.value.y}px`,
    })

const KEY = 'ink-chip'
const TOP = 64 // below the header
const BOTTOM = 44 // above the footer
const maxY = () => Math.max(TOP, window.innerHeight - BOTTOM - (rootEl.value?.offsetHeight ?? 36))

// a pick collapses the row; after a keyboard pick, don't leave focus on a
// button that just collapsed away
function settle(e: MouseEvent) {
  open.value = false
  if (!e.detail) mainEl.value?.focus()
}
function pickInk(t: string, e: MouseEvent) {
  token.value = t
  eraser.value = false
  settle(e)
}
function pickEraser(e: MouseEvent) {
  eraser.value = true
  settle(e)
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(pos.value))
  }
  catch {}
}
function restore() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && (raw.side === 'l' || raw.side === 'r') && Number.isFinite(raw.y)) {
      pos.value = { side: raw.side, y: Math.min(Math.max(raw.y, TOP), maxY()) }
    }
  }
  catch {}
}

function goHome() {
  pos.value = { side: 'r', y: null }
  save()
}

let start = { x: 0, y: 0 }
let base: DOMRect | null = null
let moved = false
function onGripDown(e: PointerEvent) {
  if (e.button !== 0 || !rootEl.value) return
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  base = rootEl.value.getBoundingClientRect()
  start = { x: e.clientX, y: e.clientY }
  moved = false
  dragging.value = true
  document.documentElement.classList.add('ink-noselect')
}
function onGripMove(e: PointerEvent) {
  if (!dragging.value || !base || !rootEl.value) return
  // a plain click on the grip must not count as a move (it would leave home)
  if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 4) return
  moved = true
  const dx = Math.min(Math.max(e.clientX - start.x, 8 - base.left), window.innerWidth - 8 - base.right)
  const dy = Math.min(Math.max(e.clientY - start.y, TOP - base.top), window.innerHeight - BOTTOM - base.bottom)
  rootEl.value.style.transform = `translate(${dx}px, ${dy}px)`
}
function onGripUp() {
  if (!dragging.value || !rootEl.value) return
  const r = rootEl.value.getBoundingClientRect()
  rootEl.value.style.transform = ''
  dragging.value = false
  base = null
  document.documentElement.classList.remove('ink-noselect')
  if (!moved) return
  pos.value = {
    side: r.left + r.width / 2 < window.innerWidth / 2 ? 'l' : 'r',
    y: Math.round(Math.min(Math.max(r.top, TOP), maxY())),
  }
  save()
}

const onResize = () => {
  if (pos.value.y != null) pos.value = { ...pos.value, y: Math.min(Math.max(pos.value.y, TOP), maxY()) }
}
// collapse on the first press anywhere else (it is also a stroke starting) and on Esc
const onDown = (e: PointerEvent) => {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target as Node)) open.value = false
}
const onKey = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || !open.value) return
  if (rootEl.value?.contains(document.activeElement)) mainEl.value?.focus()
  open.value = false
}
onMounted(() => {
  restore()
  window.addEventListener('resize', onResize)
  window.addEventListener('pointerdown', onDown)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('pointerdown', onDown)
  window.removeEventListener('keydown', onKey)
  document.documentElement.classList.remove('ink-noselect')
})
</script>

<style scoped>
/* home: right edge, a little above the footer */
.chip.is-home {
  right: 40px;
  bottom: 156px;
}

.chip-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 10px 0 6px;
  border: 1px solid var(--line);
  border-radius: 9999px;
  background: var(--paper);
  color: var(--ink);
  box-shadow: 0 2px 10px color-mix(in srgb, var(--ink) 6%, transparent);
  transition: border-color 0.2s ease, box-shadow 0.25s ease;
}
/* the grip sits on the screen-edge side; the row opens away from it */
.chip.is-right .chip-pill {
  flex-direction: row-reverse;
  padding: 0 6px 0 10px;
}
.chip-pill:hover {
  border-color: color-mix(in srgb, var(--ink) 45%, var(--line));
}
.chip.is-drag .chip-pill {
  border-color: var(--ink);
  box-shadow: 0 10px 26px color-mix(in srgb, var(--ink) 18%, transparent);
}

/* eight dots; darker on hover / while dragging, since nothing else says "movable" */
.chip-grip {
  flex: none;
  width: 16px;
  height: 24px;
  border-radius: 6px;
  background-image: radial-gradient(circle, var(--ink) 1.1px, transparent 1.5px);
  background-size: 6px 6px;
  background-position: 2px 0;
  opacity: 0.35;
  touch-action: none;
  transition: opacity 0.2s ease, background-color 0.2s ease;
}
.chip-grip:hover,
.chip.is-drag .chip-grip {
  opacity: 0.85;
  background-color: color-mix(in srgb, var(--ink) 8%, transparent);
}

.chip-main {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 100%;
}
.chip-dot {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  border: 1px solid var(--line);
}
.chip-name {
  min-width: 46px;
  text-align: left;
}
.chip-caret {
  opacity: 0.5;
}
.chip-main:focus-visible,
.chip-sw:focus-visible {
  outline: 1px solid var(--ink);
  outline-offset: 2px;
}

/* the row of inks: width animates open, away from the grip */
.chip-more {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 0;
  padding: 4px 0; /* room for the active ring, which overflow would clip */
  overflow: hidden;
  opacity: 0;
  transition: max-width 0.32s ease, opacity 0.22s ease, padding 0.32s ease;
}
.chip-more.is-open {
  max-width: 240px;
  padding: 4px;
  opacity: 1;
}
.chip-grp {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chip-sw {
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  border: 1px solid var(--line);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.chip-sw:hover {
  transform: scale(1.2);
}
.chip-sw.is-active {
  box-shadow: 0 0 0 2px var(--paper), 0 0 0 3px var(--ink);
}
.chip-x,
.chip-tool {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  color: var(--ink);
}
/* the eraser glyph stands in for the ink dot while the eraser is on */
.chip-dot-eraser {
  display: flex;
  align-items: center;
  justify-content: center;
  border-color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .chip-pill,
  .chip-grip,
  .chip-more,
  .chip-sw {
    transition: none;
  }
}
</style>
