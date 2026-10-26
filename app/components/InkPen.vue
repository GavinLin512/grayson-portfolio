<template>
  <ClientOnly>
    <template v-if="enabled">
      <!-- persistent drawing layer -->
      <canvas ref="permEl" class="ink-layer z-[80]" aria-hidden="true" />
      <!-- fading trail / blot layer -->
      <canvas ref="trailEl" class="ink-layer z-[81]" aria-hidden="true" />

      <!-- palette: a draggable chip (ink/Chip.vue), bottom-right by default -->
      <InkChip />

      <!-- the pen that replaces the cursor -->
      <div ref="penEl" class="ink-pen fixed top-0 left-0 z-[110] pointer-events-none">
        <PenGlyph :size="46" :nib="`var(${colorToken})`" />
      </div>
      <!-- the eraser's cursor: a ring as wide as what it wipes, centred on the pointer -->
      <div ref="ringEl" class="ink-ring fixed top-0 left-0 z-[110] pointer-events-none" :style="{ width: `${ERASER_D}px`, height: `${ERASER_D}px` }" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
// PenGlyph tip at (6, 94) of viewBox 100, rendered at size 46
const TIP_X = 6 * 0.46
const TIP_Y = 94 * 0.46
const ERASER_D = 24 // eraser diameter, px

const enabled = ref(false)
const { token: colorToken, eraser, clearTick } = useInk()
const permEl = ref<HTMLCanvasElement | null>(null)
const trailEl = ref<HTMLCanvasElement | null>(null)
const penEl = ref<HTMLElement | null>(null)
const ringEl = ref<HTMLElement | null>(null)

interface StrokePt { x: number; y: number; w: number }
interface Stroke { token: string; pts: StrokePt[]; erase?: boolean }
const strokes: Stroke[] = []
let clearPerm: (() => void) | null = null

function clearAll() {
  strokes.length = 0
  clearPerm?.()
}

// the palette chip clears through the shared signal; registered here in
// setup, before the mount hook below awaits anything
watch(clearTick, clearAll)

// The cursor is the pen glyph, or the ring while the eraser is on. Both hide
// over text fields (native caret); over the palette the glyph stays, so
// picking an ink is not done through a 24px ring. Re-run when the tool changes
// under a still pointer.
const over = { palette: false, field: false }
function syncCursor() {
  penEl.value?.classList.toggle('is-off', over.field || (eraser.value && !over.palette))
  ringEl.value?.classList.toggle('is-off', over.field || !eraser.value || over.palette)
}
watch(eraser, syncCursor)

function isInteractive(t: EventTarget | null) {
  return t instanceof Element
    && !!t.closest('a, button, input, textarea, select, label, summary, [role="button"], .ink-palette')
}
// the eraser may start anywhere (links and buttons included) except the
// palette itself and form fields
function blocksErase(t: EventTarget | null) {
  return t instanceof Element
    && !!t.closest('.ink-palette, input, textarea, select, [contenteditable]')
}

// The pen needs a fine pointer (mouse / trackpad) and follows it live: a
// touch screen can't draw, and DevTools device mode flips it without a
// reload, so the canvases, cursor and palette come and go with it. `strokes`
// survives a stop and is replayed on the next start.
// The listeners are attached after an await, where onBeforeUnmount cannot be
// registered: hand the teardown to this one
let cleanup: (() => void) | null = null
let run = 0 // bumped by every start / stop: a start still awaiting is dropped
function stop() {
  run++
  cleanup?.()
  cleanup = null
  enabled.value = false
}
let fine: MediaQueryList | null = null
const onPointerChange = () => (fine?.matches ? start() : stop())
onBeforeUnmount(() => {
  fine?.removeEventListener('change', onPointerChange)
  stop()
})

onMounted(() => {
  fine = window.matchMedia('(pointer: fine)')
  fine.addEventListener('change', onPointerChange)
  if (fine.matches) start()
})

async function start() {
  if (cleanup) return
  const id = ++run
  enabled.value = true
  await nextTick()
  if (id !== run) return

  const perm = permEl.value
  const trail = trailEl.value
  const pen = penEl.value
  const ring = ringEl.value
  if (!perm || !trail || !pen || !ring) return
  const pctx = perm.getContext('2d')
  const tctx = trail.getContext('2d')
  if (!pctx || !tctx) return

  document.documentElement.classList.add('pen-on')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const TRAIL_LIFE = 1800
  const BLOT_LIFE = 1300
  interface TrailPt extends StrokePt { t: number; gap: boolean }
  interface Blot { x: number; y: number; t: number; r: number; seeds: number[] }
  const trailPts: TrailPt[] = []
  const blots: Blot[] = []

  // resolved token colors, invalidated on theme switch
  let colorCache: Record<string, string> = {}
  const inkOf = (token: string) =>
    colorCache[token] ??= (getComputedStyle(document.documentElement).getPropertyValue(token).trim() || '#1f1b17')

  // butt-jointed quad ribbon with 45°-nib width modulation — the one renderer
  // for hover trail AND permanent strokes, so every mark reads as a pen line.
  // (Round-cap segments are out: overlapping translucent caps bead into dots.)
  interface RibbonPt { x: number; y: number; hw: number; a: number }
  const fillRibbon = (ctx: CanvasRenderingContext2D, pts: RibbonPt[], ink: string) => {
    const n = pts.length
    if (n < 2) return
    const nx: number[] = []
    const ny: number[] = []
    const hw: number[] = []
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)]!
      const b = pts[Math.min(i + 1, n - 1)]!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.hypot(dx, dy) || 1
      nx[i] = -dy / len
      ny[i] = dx / len
      const nib = 0.5 + 0.5 * Math.abs(Math.sin(Math.atan2(dy, dx) - Math.PI / 4))
      hw[i] = pts[i]!.hw * nib
    }
    ctx.fillStyle = ink
    if (pts.every((p) => p.a === pts[0]!.a)) {
      // uniform alpha (permanent strokes): one closed outline, one fill —
      // per-quad fills leave antialiased seams at every shared edge
      ctx.globalAlpha = pts[0]!.a
      ctx.beginPath()
      ctx.moveTo(pts[0]!.x + nx[0]! * hw[0]!, pts[0]!.y + ny[0]! * hw[0]!)
      for (let i = 1; i < n; i++) ctx.lineTo(pts[i]!.x + nx[i]! * hw[i]!, pts[i]!.y + ny[i]! * hw[i]!)
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(pts[i]!.x - nx[i]! * hw[i]!, pts[i]!.y - ny[i]! * hw[i]!)
      ctx.closePath()
      ctx.fill()
    }
    else {
      // fading trail: alpha varies along the ribbon, fill edge-sharing quads
      for (let i = 1; i < n; i++) {
        ctx.globalAlpha = pts[i]!.a
        ctx.beginPath()
        ctx.moveTo(pts[i - 1]!.x + nx[i - 1]! * hw[i - 1]!, pts[i - 1]!.y + ny[i - 1]! * hw[i - 1]!)
        ctx.lineTo(pts[i]!.x + nx[i]! * hw[i]!, pts[i]!.y + ny[i]! * hw[i]!)
        ctx.lineTo(pts[i]!.x - nx[i]! * hw[i]!, pts[i]!.y - ny[i]! * hw[i]!)
        ctx.lineTo(pts[i - 1]!.x - nx[i - 1]! * hw[i - 1]!, pts[i - 1]!.y - ny[i - 1]! * hw[i - 1]!)
        ctx.closePath()
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  // pointer events land ~16 ms apart, so a quick curve is only a few samples:
  // joined straight, the ribbon shows the polygon's corners (and the nib width
  // jumps at each one). Run a centripetal Catmull-Rom spline through them — no
  // overshoot, no cusps — and resample it every couple of px, carrying width
  // and alpha along
  const SMOOTH_STEP = 2
  const smooth = (pts: RibbonPt[]): RibbonPt[] => {
    const n = pts.length
    if (n < 3) return pts
    // centripetal knot spacing; the floor keeps repeated samples from dividing by zero
    const knot = (p: RibbonPt, q: RibbonPt) => Math.max(Math.sqrt(Math.hypot(q.x - p.x, q.y - p.y)), 1e-4)
    const out: RibbonPt[] = [pts[0]!]
    for (let i = 0; i < n - 1; i++) {
      const p1 = pts[i]!
      const p2 = pts[i + 1]!
      const cx = p2.x - p1.x
      const cy = p2.y - p1.y
      const d2 = knot(p1, p2)
      // Hermite tangents scaled to this segment; the end segments have no
      // outer neighbour and keep the chord
      let m1x = cx
      let m1y = cy
      let m2x = cx
      let m2y = cy
      if (i > 0) {
        const p0 = pts[i - 1]!
        const d1 = knot(p0, p1)
        m1x += d2 * ((p1.x - p0.x) / d1 - (p2.x - p0.x) / (d1 + d2))
        m1y += d2 * ((p1.y - p0.y) / d1 - (p2.y - p0.y) / (d1 + d2))
      }
      if (i < n - 2) {
        const p3 = pts[i + 2]!
        const d3 = knot(p2, p3)
        m2x += d2 * ((p3.x - p2.x) / d3 - (p3.x - p1.x) / (d2 + d3))
        m2y += d2 * ((p3.y - p2.y) / d3 - (p3.y - p1.y) / (d2 + d3))
      }
      const steps = Math.max(1, Math.ceil(Math.hypot(cx, cy) / SMOOTH_STEP))
      for (let s = 1; s <= steps; s++) {
        const t = s / steps
        const t2 = t * t
        const t3 = t2 * t
        const h00 = 2 * t3 - 3 * t2 + 1
        const h10 = t3 - 2 * t2 + t
        const h01 = 3 * t2 - 2 * t3
        const h11 = t3 - t2
        out.push({
          x: h00 * p1.x + h10 * m1x + h01 * p2.x + h11 * m2x,
          y: h00 * p1.y + h10 * m1y + h01 * p2.y + h11 * m2y,
          hw: p1.hw + (p2.hw - p1.hw) * t,
          a: p1.a + (p2.a - p1.a) * t,
        })
      }
    }
    return out
  }

  // a stroke as ribbon points: both ends sharpen to a point over the last
  // few samples — the nib touching down and lifting off
  const strokeRibbon = (s: Stroke): RibbonPt[] => {
    const n = s.pts.length
    return smooth(s.pts.map((p, i) => {
      const edge = Math.min(i, n - 1 - i)
      return { x: p.x, y: p.y, hw: (p.w / 2) * Math.min(1, (edge + 0.2) / 3.5), a: 0.92 }
    }))
  }

  // erasing paints destination-out onto the persistent layer. Every pass is
  // also recorded in `strokes` and replayed in order: redrawPerm runs on each
  // press / release (ink-noselect flips the html class), theme flip and resize,
  // so a pixel-only wipe would be undone by the next click.
  const wipe = (ctx: CanvasRenderingContext2D, pts: StrokePt[], from = 0) => {
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.globalAlpha = 1
    ctx.fillStyle = '#000'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = ERASER_D
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    if (pts.length === 1) {
      ctx.arc(pts[0]!.x, pts[0]!.y, ERASER_D / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    else {
      ctx.moveTo(pts[from]!.x, pts[from]!.y)
      for (let i = from + 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
      ctx.stroke()
    }
    ctx.restore()
  }

  const redrawPerm = () => {
    pctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    for (const s of strokes) {
      if (s.erase) wipe(pctx, s.pts)
      else fillRibbon(pctx, strokeRibbon(s), inkOf(s.token))
    }
  }
  clearPerm = () => pctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

  const resize = () => {
    const dpr = window.devicePixelRatio || 1
    for (const [cv, ctx] of [[perm, pctx], [trail, tctx]] as const) {
      cv.width = window.innerWidth * dpr
      cv.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    redrawPerm()
  }
  resize()
  window.addEventListener('resize', resize)

  // recolor persistent strokes when light/dark class flips
  const mo = new MutationObserver(() => {
    colorCache = {}
    redrawPerm()
  })
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  let down = false
  let downX = 0
  let downY = 0
  let drawing: Stroke | null = null
  let lastDraw: StrokePt | null = null
  let lastDrawT = 0
  let lastTrail: TrailPt | null = null
  let prevX = 0
  let prevT = 0
  let tilt = 0

  const onMove = (e: PointerEvent) => {
    const x = e.clientX
    const y = e.clientY
    const t = performance.now()

    // pen follows the pointer, leaning with horizontal velocity;
    // hidden over text fields where the native caret matters
    const vx = prevT ? (x - prevX) / Math.max(t - prevT, 1) : 0
    tilt = tilt * 0.85 + Math.max(-10, Math.min(10, vx * 6)) * 0.15
    prevX = x
    prevT = t
    pen.style.transform = `translate(${x - TIP_X}px, ${y - TIP_Y}px) rotate(${tilt.toFixed(2)}deg)`
    over.field = e.target instanceof Element && !!e.target.closest('input, textarea, select')
    over.palette = e.target instanceof Element && !!e.target.closest('.ink-palette')
    pen.classList.add('is-visible')
    ring.classList.add('is-visible')
    ring.style.transform = `translate(${x - ERASER_D / 2}px, ${y - ERASER_D / 2}px)`
    syncCursor()

    if (down) {
      if (!drawing && Math.hypot(x - downX, y - downY) > 4) {
        // an erase pass starts at the press point, so the 4px threshold leaves no gap
        drawing = eraser.value
          ? { token: colorToken.value, pts: [{ x: downX, y: downY, w: ERASER_D }], erase: true }
          : { token: colorToken.value, pts: [] }
        strokes.push(drawing)
        lastDraw = null
        // an erase pass that began on a link was a drag, not a click
        if (onLink) swallowClick = true
      }
      if (drawing?.erase) {
        drawing.pts.push({ x, y, w: ERASER_D })
        wipe(pctx, drawing.pts, drawing.pts.length - 2)
      }
      else if (drawing) {
        let w = 4.2
        if (lastDraw) {
          const speed = Math.hypot(x - lastDraw.x, y - lastDraw.y) / Math.max(t - lastDrawT, 1)
          w = lastDraw.w * 0.65 + Math.min(7.5, Math.max(2.4, 7.6 - speed * 1.8)) * 0.35
        }
        const p = { x, y, w }
        drawing.pts.push(p)
        lastDraw = p
        lastDrawT = t
      }
      return
    }

    if (reduced || eraser.value) return
    let w = 3
    let gap = true
    if (lastTrail) {
      const dt = t - lastTrail.t
      if (dt < 120) {
        gap = false
        const speed = Math.hypot(x - lastTrail.x, y - lastTrail.y) / Math.max(dt, 1)
        w = lastTrail.w * 0.7 + Math.min(6.8, Math.max(1.8, 6.9 - speed * 2)) * 0.3
      }
    }
    const p = { x, y, t, w, gap }
    trailPts.push(p)
    lastTrail = p
  }

  // an erase pass may begin on a link / button; if it turns into a drag the
  // click that follows must not fire (a plain click still does)
  let onLink = false
  let swallowClick = false
  const onClickCapture = (e: MouseEvent) => {
    if (!swallowClick) return
    swallowClick = false
    e.preventDefault()
    e.stopPropagation()
  }

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    pen.classList.add('is-down')
    ring.classList.add('is-down')
    swallowClick = false
    onLink = false
    if (eraser.value ? blocksErase(e.target) : isInteractive(e.target)) return
    onLink = eraser.value && isInteractive(e.target)
    down = true
    downX = e.clientX
    downY = e.clientY
    document.documentElement.classList.add('ink-noselect')
  }

  const endStroke = () => {
    pen.classList.remove('is-down')
    ring.classList.remove('is-down')
    document.documentElement.classList.remove('ink-noselect')
    if (drawing && drawing.pts.length < 2) strokes.pop()
    // commit the finished stroke to the persistent layer in one ribbon fill
    // (an erase pass was already applied, segment by segment)
    else if (drawing && !drawing.erase) fillRibbon(pctx, strokeRibbon(drawing), inkOf(drawing.token))
    down = false
    drawing = null
    lastDraw = null
  }

  const onUp = (e: PointerEvent) => {
    if (down && !drawing) {
      if (eraser.value) {
        // a click wipes a dot, kept as its own stroke so redraws replay it;
        // on a link it is a plain click and does neither
        if (!onLink) {
          const dot = { x: e.clientX, y: e.clientY, w: ERASER_D }
          strokes.push({ token: colorToken.value, pts: [dot], erase: true })
          wipe(pctx, [dot])
        }
      }
      else if (!reduced) {
        blots.push({
          x: e.clientX,
          y: e.clientY,
          t: performance.now(),
          r: 9 + Math.random() * 9,
          seeds: Array.from({ length: 5 }, () => Math.random()),
        })
      }
    }
    endStroke()
    // a drag that ends off the link may never produce the click: don't let the
    // flag eat the user's next real one
    if (swallowClick) setTimeout(() => (swallowClick = false), 0)
  }

  const onDragStart = (e: Event) => {
    if (down) e.preventDefault()
  }

  const onLeaveWindow = () => {
    pen.classList.remove('is-visible')
    ring.classList.remove('is-visible')
    lastTrail = null
  }

  // the hover trail "dries out": width and alpha taper with age, and the
  // fresh end tapers to a point like ink leaving the nib
  const ribbon = (pts: TrailPt[], now: number, ink: string) => {
    const rp: RibbonPt[] = pts.map((p) => {
      const age = (now - p.t) / TRAIL_LIFE
      return { x: p.x, y: p.y, hw: (p.w / 2) * (1 - age), a: 0.36 * (1 - age) }
    })
    rp[rp.length - 1]!.hw *= 0.3
    fillRibbon(tctx, rp, ink)
  }

  let raf = 0
  const draw = () => {
    raf = requestAnimationFrame(draw)
    const now = performance.now()
    while (trailPts.length && now - trailPts[0]!.t > TRAIL_LIFE) trailPts.shift()
    while (blots.length && now - blots[0]!.t > BLOT_LIFE) blots.shift()
    tctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    // live preview of the in-progress stroke rides the per-frame trail layer;
    // it is committed to the persistent layer once, on pointerup
    if (drawing && !drawing.erase && drawing.pts.length > 1) fillRibbon(tctx, strokeRibbon(drawing), inkOf(drawing.token))
    if (!trailPts.length && !blots.length) return

    const ink = inkOf(colorToken.value)
    let run: TrailPt[] = []
    for (const p of trailPts) {
      if (p.gap && run.length > 1) ribbon(run, now, ink)
      if (p.gap) run = []
      run.push(p)
    }
    if (run.length > 1) ribbon(run, now, ink)

    tctx.fillStyle = ink
    for (const b of blots) {
      const k = (now - b.t) / BLOT_LIFE
      const bloom = 1 - (1 - Math.min(k * 2.5, 1)) ** 3
      const r = b.r * bloom
      tctx.globalAlpha = 0.32 * (1 - k)
      tctx.beginPath()
      tctx.arc(b.x, b.y, r, 0, Math.PI * 2)
      tctx.fill()
      for (let s = 0; s < 3; s++) {
        const a = b.seeds[s]! * Math.PI * 2
        const d = r * (0.9 + b.seeds[s + 1]! * 0.5)
        tctx.beginPath()
        tctx.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, r * 0.22 * (1 + b.seeds[s]!), 0, Math.PI * 2)
        tctx.fill()
      }
    }
    tctx.globalAlpha = 1
  }
  raf = requestAnimationFrame(draw)

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', endStroke)
  window.addEventListener('blur', endStroke)
  window.addEventListener('dragstart', onDragStart)
  window.addEventListener('click', onClickCapture, true)
  document.documentElement.addEventListener('pointerleave', onLeaveWindow)

  cleanup = () => {
    cancelAnimationFrame(raf)
    mo.disconnect()
    document.documentElement.classList.remove('pen-on', 'ink-noselect')
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', endStroke)
    window.removeEventListener('blur', endStroke)
    window.removeEventListener('dragstart', onDragStart)
    window.removeEventListener('click', onClickCapture, true)
    document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
  }
}
</script>

<style scoped>
.ink-layer {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
}

.ink-pen {
  opacity: 0;
  transition: opacity 0.35s ease;
  will-change: transform;
  /* rotate around the nib tip */
  transform-origin: 2.76px 43.24px;
}
.ink-pen.is-visible {
  opacity: 1;
}
.ink-pen.is-off {
  opacity: 0;
}
.ink-pen :deep(svg) {
  display: block;
  transition: transform 0.12s ease;
}
.ink-pen.is-down :deep(svg) {
  transform: translate(1.5px, 2.5px);
}

/* the eraser's cursor: a ring as wide as the wipe, centred on the pointer */
.ink-ring {
  opacity: 0;
  border: 1px solid color-mix(in srgb, var(--ink) 70%, transparent);
  border-radius: 9999px;
  background: color-mix(in srgb, var(--paper) 35%, transparent);
  transition: opacity 0.35s ease, border-color 0.12s ease;
  will-change: transform;
}
.ink-ring.is-visible {
  opacity: 1;
}
.ink-ring.is-off {
  opacity: 0;
}
/* pressed: darker edge, same size — the ring is exactly what gets wiped */
.ink-ring.is-down {
  border-color: var(--ink);
}
</style>

<style>
/* the pen replaces the cursor everywhere, except where a caret is needed */
.pen-on,
.pen-on * {
  cursor: none !important;
}
.pen-on input,
.pen-on textarea,
.pen-on select {
  cursor: auto !important;
}
/* while sketching, don't fight text selection */
.ink-noselect,
.ink-noselect * {
  user-select: none !important;
  -webkit-user-select: none !important;
}
</style>
