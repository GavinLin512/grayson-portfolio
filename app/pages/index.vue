<template>
  <div class="relative h-full overflow-hidden" :class="{ 'qc-play': play }">
    <!-- a faint fountain-pen watercolour of a lakeside town, under everything -->
    <BgWatercolor :play="play" />

    <!-- paper grain (plan §5: opacity 0.03–0.06, barely perceptible) -->
    <div class="qc-grain absolute inset-0 z-0 max-lg:hidden pointer-events-none" aria-hidden="true" />

    <!-- candlelight: a warm glow along the bottom edge, breathing on a 7s cycle -->
    <div class="qc-candle hidden lg:block absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />

    <!-- astrolabe behind the reading column: the outer ring holds still, the
         rete turns once every 32s, and a hairline hand sets off from the real
         hour and sweeps the other way at the same pace (client only; SSR and
         automation keep it at XII) -->
    <svg
      class="qc-astro hidden lg:block max-lg:block max-lg:left-[100%] max-lg:top-[27%] max-lg:scale-[.66] max-lg:opacity-60 absolute left-1/2 top-1/2 w-[640px] h-[640px] -translate-x-1/2 -translate-y-1/2 z-0 text-ink pointer-events-none overflow-visible"
      viewBox="-320 -320 640 640"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <g>
        <circle r="300" stroke-width="0.7" stroke-dasharray="2 6" opacity="0.45" />
        <circle r="290" stroke-width="0.6" opacity="0.36" />
        <line
          v-for="(t, i) in astroTicks"
          :key="i"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          :stroke-width="t.big ? 0.8 : 0.5"
          :opacity="t.big ? 0.45 : 0.32"
        />
        <text
          v-for="n in astroNumerals"
          :key="n.label"
          :x="n.x"
          :y="n.y"
          :transform="`rotate(${n.rot} ${n.x} ${n.y})`"
          class="font-mono fill-gold"
          font-size="9"
          letter-spacing="0.9"
          text-anchor="middle"
          dominant-baseline="middle"
          stroke="none"
          opacity="0.7"
        >{{ n.label }}</text>
      </g>
      <g class="qc-astro-rete">
        <circle r="206" stroke-width="0.6" stroke-dasharray="1 5" opacity="0.4" />
        <circle r="150" cx="38" cy="-26" stroke-width="0.6" opacity="0.32" />
        <circle r="144" cx="38" cy="-26" stroke-width="0.5" stroke-dasharray="3 9" opacity="0.3" />
        <path d="M33 -176 h10 M38 -181 v10 M183 -26 h10 M188 -31 v10 M-117 -26 h10 M-112 -31 v10" stroke-width="0.7" opacity="0.5" />
      </g>
      <g class="qc-hand" :style="{ transform: `rotate(${handDeg}deg)` }">
        <!-- the sweep rides its own group: an animated transform would
             override the hour angle set inline on the parent -->
        <g class="qc-hand-sweep">
          <line x1="0" y1="-34" x2="0" y2="-244" stroke-width="0.8" opacity="0.5" />
          <path d="M0 -258 L3.4 -251 L0 -244 L-3.4 -251 Z" fill="var(--gold)" stroke="none" opacity="0.9" />
        </g>
      </g>
    </svg>

    <!-- constellations: hairlines join the stars one chain at a time (lg+) -->
    <canvas ref="conEl" class="hidden lg:block absolute inset-0 z-0 w-full h-full pointer-events-none" aria-hidden="true" />

    <!-- manuscript page frame: the rules grow from the corners toward the
         midpoint diamonds; each corner is a quarter of a magic circle, a
         ring of glyphs between two arcs; a spell band of glyphs runs inward
         of the rules; folio cartouche rides the top rule -->
    <div class="hidden lg:block absolute inset-[24px] z-0 pointer-events-none" aria-hidden="true">
      <i v-for="r in rules" :key="r.id" class="qc-rule" :class="r.h ? 'qc-rule-h' : 'qc-rule-v'" :style="r.style" />

      <!-- spell band tiles: a hairline with a glyph every 48px; the bottom
           and right bands are mirrored in CSS so the glyphs face inward -->
      <svg class="absolute w-0 h-0">
        <defs>
          <pattern id="qc-band-x" width="288" height="9" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="var(--ink)" stroke-linecap="round" stroke-linejoin="round">
              <path d="M0 6.5 H288" stroke-width="0.5" stroke-opacity="0.3" />
              <path v-for="(d, i) in BAND" :key="i" :d="d" :transform="`translate(${24 + i * 48} 3.1) scale(0.8)`" stroke-width="0.75" stroke-opacity="0.5" />
            </g>
          </pattern>
          <pattern id="qc-band-y" width="9" height="288" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="var(--ink)" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6.5 0 V288" stroke-width="0.5" stroke-opacity="0.3" />
              <path v-for="(d, i) in BAND" :key="i" :d="d" :transform="`translate(3.1 ${24 + i * 48}) rotate(-90) scale(0.8)`" stroke-width="0.75" stroke-opacity="0.5" />
            </g>
          </pattern>
        </defs>
      </svg>
      <div v-for="s in ['top', 'bottom', 'left', 'right']" :key="s" class="qc-scale" :class="`qc-scale-${s}`">
        <svg class="block w-full h-full">
          <rect width="100%" height="100%" :fill="`url(#qc-band-${s === 'top' || s === 'bottom' ? 'x' : 'y'})`" />
        </svg>
      </div>

      <svg
        v-for="pos in ['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 right-0 rotate-180', 'bottom-0 left-0 -rotate-90']"
        :key="pos"
        class="absolute w-[84px] h-[84px] overflow-visible"
        :class="pos"
        viewBox="0 0 84 84"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M72 0 A72 72 0 0 1 0 72" pathLength="1" class="qc-draw-in" stroke-width="0.9" style="--i: 0; --o: 0.5" />
        <path d="M61 0 A61 61 0 0 1 0 61" pathLength="1" class="qc-draw-in" stroke-width="0.6" style="--i: 1; --o: 0.35" />
        <path
          v-for="(g, i) in cornerGlyphs"
          :key="i"
          pathLength="1"
          class="qc-draw-in"
          :d="g.d"
          :transform="g.transform"
          stroke-width="0.6"
          :style="{ '--i': 2 + i * 0.5, '--o': 0.55 }"
        />
        <circle cx="25.3" cy="25.3" r="14" pathLength="1" class="qc-draw-in" stroke-width="0.7" style="--i: 3; --o: 0.45" />
        <circle cx="25.3" cy="25.3" r="10" stroke-width="0.5" stroke-dasharray="1.2 2" class="qc-fill-in" style="--o: 0.4" />
        <path :d="CORNER_TRI" pathLength="1" class="qc-draw-in" stroke-width="0.6" style="--i: 4; --o: 0.45" />
        <circle cx="47" cy="47" r="2.1" fill="var(--gold)" stroke="none" class="qc-fill-in" style="--o: 0.85" />
        <circle cx="25.3" cy="25.3" r="2.6" fill="var(--gold)" stroke="none" class="qc-fill-in" style="--o: 0.8" />
      </svg>

      <span class="qc-diamond qc-fill-in absolute top-[calc(50%-5px)] -left-[5px]" style="--o: .7" />
      <span class="qc-diamond qc-fill-in absolute top-[calc(50%-5px)] -right-[5px]" style="--o: .7" />
      <span class="qc-diamond qc-fill-in absolute -bottom-[5px] left-[calc(50%-5px)]" style="--o: .7" />
      <div class="qc-fill-in absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg px-[16px] flex items-center gap-[10px]" style="--o: 1">
        <span class="qc-diamond-sm" />
        <span class="font-mono text-14 tracking-[0.08em] opacity-70">N° 2026 — 04</span>
        <span class="qc-diamond-sm" />
      </div>
    </div>

    <!-- botanical sprig growing out of the lower-left corner along the bottom
         rule; hatched leaves unfurl and tendrils curl off in growth order,
         three gold berries ripen at the tip. Sits below TickWall (bottom 110)
         and short of the mid-rule diamond. -->
    <svg
      class="qc-vine hidden lg:block absolute left-[74px] bottom-[26px] w-[420px] h-[80px] z-0 text-herb pointer-events-none overflow-visible"
      viewBox="0 0 420 80"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path class="qc-stem" :d="vine.d" pathLength="1" stroke-width="1.15" opacity="0.85" />
      <g v-for="(leaf, i) in vine.leaves" :key="i" :transform="leaf.transform" :style="{ '--d': leaf.delay }">
        <path class="qc-leaf" d="M0 0 C 7 -10 18 -13 27 -6 C 19 -1 9 2 0 0 Z" pathLength="1" stroke-width="0.9" fill="currentColor" fill-opacity="0.1" />
        <path class="qc-vein" d="M2 -0.5 C 10 -5 18 -7 25 -6" pathLength="1" stroke-width="0.6" opacity="0.7" />
        <path class="qc-vein" d="M8 -4 L10 -7.4 M12.4 -5.2 L14.4 -9 M16.8 -6.1 L18.6 -9.4 M21 -6.3 L22.4 -8.3" pathLength="1" stroke-width="0.45" opacity="0.55" />
      </g>
      <path v-for="(t, i) in vine.tendrils" :key="`t${i}`" class="qc-vein" :d="t.d" pathLength="1" stroke-width="0.65" opacity="0.7" :style="{ '--d': t.delay }" />
      <path class="qc-vein" :d="vine.stalks" pathLength="1" stroke-width="0.7" opacity="0.8" :style="{ '--d': vine.stalkDelay }" />
      <g v-for="(b, i) in vine.berries" :key="`b${i}`" class="qc-berry" :style="{ '--d': b.delay }">
        <circle :cx="b.cx" :cy="b.cy" :r="b.r" fill="var(--gold)" fill-opacity="0.9" stroke="var(--ink)" stroke-width="0.5" stroke-opacity="0.45" />
        <!-- white, not --paper: dark paper is darker than the gold -->
        <circle :cx="b.hx" :cy="b.hy" :r="b.hr" fill="#fff" stroke="none" opacity="0.6" />
      </g>
    </svg>

    <!-- folio number, plain top-right on small screens -->
    <span class="qc-fade lg:hidden absolute right-[24px] top-[28px] font-mono text-14 tracking-[0.08em]" style="--d: .45s; --o: .7">
      N° 2026 — 04
    </span>

    <!-- marginalia note (desktop only) -->
    <p class="qc-fade hidden lg:block absolute left-[60px] top-[124px] font-mono text-14 leading-[1.7]" style="--d: .3s; --o: .8">
      — 01 / hello.<br />
      portfolio of grayson — a frontend<br />
      engineer based in taipei.
    </p>

    <!-- tally marks in the left margin -->
    <TickWall
      :count="5"
      :length="56"
      :gap="16"
      class="qc-fade hidden lg:block absolute left-[60px] bottom-[110px]"
      style="--d: .6s"
    />

    <!-- title block: a single reading column, like a book page -->
    <div class="relative z-10 h-full flex items-center px-6 lg:px-[60px]">
      <div class="relative w-full max-w-[680px] mx-auto">
        <span class="qc-fade block font-mono text-14 tracking-[0.14em]" style="--o: .7">a portfolio —</span>
        <span class="qc-fade block mt-[20px] w-[56px] border-t-2 border-ink" style="--d: .1s; --o: .5" aria-hidden="true" />
        <!-- title: the pen traces each Mincho glyph outline in reading order
             (top-left → bottom-right), and the ink soaks into each letter
             just after it is drawn. Scales with the column via viewBox. -->
        <h1 class="qc-fade mt-[26px]" style="--d: .15s">
          <svg class="qc-title block w-full h-auto overflow-visible" viewBox="0 0 680 212" role="img" aria-label="Grayson's Portfolio.">
            <text
              v-for="line in titleLines"
              :key="line.y"
              class="qc-glyphs"
              :y="line.y"
            ><tspan
              v-for="(ch, ci) in line.chars"
              :key="ci"
              :style="{ '--d': ch.delay }"
            >{{ ch.char }}</tspan></text>
          </svg>
        </h1>
        <div class="qc-fade mt-[34px] flex items-center gap-[14px]" style="--d: .3s" aria-hidden="true">
          <span class="w-[120px] border-t-2 border-ink opacity-40" />
          <!-- seal: a triangle circle ringed by six glyphs; 34px box, the
               negative margin keeps the row as tall as the old ❦ glyph -->
          <svg
            class="qc-fleuron shrink-0 text-gold w-[34px] h-[34px] -my-[10px] overflow-visible"
            viewBox="-17 -17 34 34"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle r="11" fill="currentColor" fill-opacity="0.14" stroke-width="1" />
            <circle r="7.6" stroke-width="0.6" opacity="0.85" />
            <path :d="SEAL_TRI" stroke-width="0.7" />
            <circle r="1.9" fill="currentColor" stroke="none" />
            <g class="qc-seal-ring" stroke-width="0.7">
              <path v-for="(g, i) in sealGlyphs" :key="i" :d="g.d" :transform="g.transform" />
            </g>
          </svg>
          <span class="w-[36px] border-t-2 border-ink opacity-40" />
        </div>
        <p class="qc-fade font-mono text-14 mt-[20px]" style="--d: .4s; --o: .8">
          design · code · craft / 2018 → 2026
        </p>
      </div>
    </div>

    <!-- scattered four-point sparks, each with its own size / delay / tempo;
         x / y are the star centres in % of the page -->
    <svg
      v-for="(s, i) in stars"
      :key="i"
      class="qc-star hidden lg:block absolute z-0 text-gold opacity-45 pointer-events-none"
      :class="MOBILE_STARS.includes(i) ? 'max-lg:block' : ''"
      :style="{
        left: `${s.x}%`,
        top: `${s.y}%`,
        width: `${s.size}px`,
        height: `${s.size}px`,
        margin: `${-s.size / 2}px 0 0 ${-s.size / 2}px`,
        '--ds': `${s.ds}s`,
        '--tw': `${s.tw}s`,
      }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      :stroke-width="s.sw"
      aria-hidden="true"
    >
      <path :d="SPARK" />
    </svg>

    <!-- ambient atmosphere (desktop): library dust drifting up through the
         page, and now and then a spark crossing the upper right on a hairline
         ink trail. Driven per-frame from script; see startAtmosphere. -->
    <canvas ref="fxEl" class="hidden lg:block absolute inset-0 z-0 w-full h-full pointer-events-none" aria-hidden="true" />

    <!-- first-load intro: the pen hatches back and forth (lower-left ↔ upper-right)
         while the page is slowly "drawn" from top-left to bottom-right -->
    <div
      v-show="introVisible"
      ref="introEl"
      class="fixed inset-0 z-[95] bg-bg pointer-events-none"
      aria-hidden="true"
    />
    <div v-show="introPlaying" ref="brushEl" class="qc-intro-brush fixed top-0 left-0 z-[96] pointer-events-none" aria-hidden="true">
      <PenGlyph :size="110" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Star centres in % of the page. Shared by the star field and the
// constellation lines; sizes / delays / tempos vary per star so the field
// never twinkles in unison, and sw compensates stroke width on small viewBoxes.
const stars = [
  { x: 31, y: 12, size: 18, sw: 1.1, ds: 0, tw: 4.2 },
  { x: 77, y: 8, size: 11, sw: 1.6, ds: 1.6, tw: 5.6 },
  { x: 89, y: 24, size: 20, sw: 1, ds: 0.9, tw: 4.8 },
  { x: 9, y: 38, size: 12, sw: 1.5, ds: 2.4, tw: 5.2 },
  { x: 15, y: 62, size: 9, sw: 1.8, ds: 3.1, tw: 4.4 },
  { x: 74, y: 72, size: 14, sw: 1.3, ds: 2, tw: 5 },
  { x: 40, y: 87, size: 10, sw: 1.7, ds: 1.2, tw: 6 },
  { x: 92, y: 57, size: 10, sw: 1.7, ds: 3.6, tw: 4.6 },
  { x: 22, y: 50, size: 8, sw: 1.8, ds: 2.8, tw: 5.4 },
]
const CHAINS = [
  { name: 'lyra', idx: [0, 1, 2, 7] },
  { name: 'corvus', idx: [3, 8, 4] },
  { name: 'cygnus', idx: [6, 5] },
]

// four-point spark outline, shared by the star field and the canvas shooting star
const SPARK = 'M12 2 C 12.8 8 15 10.5 21 12 C 15 13.5 12.8 16 12 22 C 11.2 16 9 13.5 3 12 C 9 10.5 11.2 8 12 2 Z'

// Frame rules: two halves per side, each growing from its corner.
const rules = [
  { id: 'tl', h: true, style: { top: 0, left: 0, transformOrigin: '0 50%' } },
  { id: 'tr', h: true, style: { top: 0, right: 0, transformOrigin: '100% 50%' } },
  { id: 'bl', h: true, style: { bottom: 0, left: 0, transformOrigin: '0 50%' } },
  { id: 'br', h: true, style: { bottom: 0, right: 0, transformOrigin: '100% 50%' } },
  { id: 'lt', h: false, style: { top: 0, left: 0, transformOrigin: '50% 0' } },
  { id: 'lb', h: false, style: { bottom: 0, left: 0, transformOrigin: '50% 100%' } },
  { id: 'rt', h: false, style: { top: 0, right: 0, transformOrigin: '50% 0' } },
  { id: 'rb', h: false, style: { bottom: 0, right: 0, transformOrigin: '50% 100%' } },
]

// Sigil glyphs (≈5px, centred on 0 0): the corner rings, the spell band
// along the frame and the seal under the title are all written in them.
const GLYPH = {
  circ: 'M1.7 0 A1.7 1.7 0 1 1 -1.7 0 A1.7 1.7 0 1 1 1.7 0',
  tri: 'M0 -2.3 L2.1 1.5 L-2.1 1.5 Z',
  wave: 'M-2.8 0 C -2 -1.9 -0.8 -1.9 0 0 C 0.8 1.9 2 1.9 2.8 0',
  bar: 'M0 -2.4 V0.6 M0 2.3 V2.31',
  eq: 'M-2.2 -1 H2.2 M-2.2 1 H2.2',
  cross: 'M-1.7 -1.7 L1.7 1.7 M1.7 -1.7 L-1.7 1.7',
}
type Glyph = keyof typeof GLYPH
const BAND = (['circ', 'tri', 'wave', 'bar', 'eq', 'cross'] as Glyph[]).map((g) => GLYPH[g])

// triangle inscribed in a circle of radius r around (cx, cy), first vertex at deg
const triangle = (cx: number, cy: number, r: number, deg: number) => `M${[0, 1, 2].map((k) => {
  const a = ((deg + k * 120) * Math.PI) / 180
  return `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`
}).join(' L')} Z`

// Corner sigil: glyphs between two quarter arcs (no ticks, so it never reads
// as another astrolabe), standing on the ring with their tops outward, and a
// triangle circle centred in the inner quarter disc (r 61): at 61 / (1 + √2)
// along both rules it clears the rules and the arc by the same 11.3.
const cornerGlyphs = ([[9, 'circ'], [22.5, 'tri'], [36, 'wave'], [54, 'wave'], [67.5, 'tri'], [81, 'circ']] as [number, Glyph][]).map(([deg, g]) => {
  const a = (deg * Math.PI) / 180
  return {
    d: GLYPH[g],
    transform: `translate(${(Math.cos(a) * 66.5).toFixed(1)} ${(Math.sin(a) * 66.5).toFixed(1)}) rotate(${deg + 90})`,
  }
})
const CORNER_TRI = triangle(25.3, 25.3, 10, 225)

// Seal under the title: the same triangle circle, ringed by six glyphs.
const SEAL_TRI = triangle(0, 0, 7.6, -90)
const sealGlyphs = (['circ', 'wave', 'tri', 'wave', 'circ', 'eq'] as Glyph[]).map((g, i) => ({
  d: GLYPH[g],
  transform: `rotate(${i * 60}) translate(0 -14.6) scale(0.62)`,
}))

// Title as two SVG text lines (baselines 88 / 188 in a 680×212 box ≈ the old
// 96px / 1.04 setting). Each draft letter gets its own delay so the pen writes
// left → right, top line → bottom line.
const LETTER_STEP = 0.13
const titleLines = (() => {
  let n = 0
  return [
    { text: "Grayson's", y: 88 },
    { text: 'Portfolio.', y: 188 },
  ].map((l) => ({
    ...l,
    chars: [...l.text].map((char) => ({ char, delay: `${(n++ * LETTER_STEP).toFixed(2)}s` })),
  }))
})()

// Astrolabe geometry: 72 ticks (every 5°, long ones on the hours) and the
// twelve hours in roman numerals, all deterministic so SSR and client agree.
const astroTicks = Array.from({ length: 72 }, (_, i) => {
  const a = (i * 5 * Math.PI) / 180
  const big = i % 6 === 0
  const inner = 290 - (big ? 13 : 5)
  return {
    x1: +(Math.cos(a) * 290).toFixed(1),
    y1: +(Math.sin(a) * 290).toFixed(1),
    x2: +(Math.cos(a) * inner).toFixed(1),
    y2: +(Math.sin(a) * inner).toFixed(1),
    big,
  }
})
const astroNumerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].map((label, i) => {
  const a = ((i * 30 - 90) * Math.PI) / 180
  return { label, x: +(Math.cos(a) * 266).toFixed(1), y: +(Math.sin(a) * 266).toFixed(1), rot: i * 30 }
})

// Botanical sprig: a Catmull-Rom stem through 8 hand-placed points, sampled
// for arc length so leaves and tendrils can be spaced evenly and delayed in
// growth order. Pure math (no getPointAtLength) so the finished sprig
// renders on the server.
// The root sits on the lower-left corner sigil's outer arc (r 72 around the
// frame corner, which is (-50, 82) in this box), 14° up from the bottom rule,
// so the stem leaves the arc almost along its radius instead of crossing it.
// It starts growing once the arc's draw-in has passed that point.
const VINE_GROW = 4.4
const VINE_START = 1.8
const ROOT = (14 * Math.PI) / 180
const vine = (() => {
  const pts = Array.from({ length: 8 }, (_, i) => i
    ? [12 + i * 52, 52 + Math.sin(i * 1.25) * 9 - i * 1.6]
    : [-50 + Math.cos(ROOT) * 72, 82 - Math.sin(ROOT) * 72])
  const samples = [{ x: pts[0]![0]!, y: pts[0]![1]!, s: 0 }]
  let d = `M${pts[0]![0]!.toFixed(1)} ${pts[0]![1]!.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[Math.min(i + 2, pts.length - 1)]!
    const c1 = [p1[0]! + (p2[0]! - p0[0]!) / 6, p1[1]! + (p2[1]! - p0[1]!) / 6]
    const c2 = [p2[0]! - (p3[0]! - p1[0]!) / 6, p2[1]! - (p3[1]! - p1[1]!) / 6]
    d += ` C ${c1[0]!.toFixed(1)} ${c1[1]!.toFixed(1)}, ${c2[0]!.toFixed(1)} ${c2[1]!.toFixed(1)}, ${p2[0]} ${p2[1]!.toFixed(1)}`
    for (let k = 1; k <= 12; k++) {
      const t = k / 12
      const u = 1 - t
      const x = u * u * u * p1[0]! + 3 * u * u * t * c1[0]! + 3 * u * t * t * c2[0]! + t * t * t * p2[0]!
      const y = u * u * u * p1[1]! + 3 * u * u * t * c1[1]! + 3 * u * t * t * c2[1]! + t * t * t * p2[1]!
      const prev = samples[samples.length - 1]!
      samples.push({ x, y, s: prev.s + Math.hypot(x - prev.x, y - prev.y) })
    }
  }
  const total = samples[samples.length - 1]!.s
  const at = (s: number) => {
    const j = Math.max(1, samples.findIndex((p) => p.s >= s))
    const a = samples[j - 1]!
    const b = samples[j]!
    const f = (s - a.s) / Math.max(b.s - a.s, 1e-6)
    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    }
  }
  const delay = (s: number) => `${(VINE_START + VINE_GROW * (s / total)).toFixed(2)}s`
  const leaves = []
  for (let s = 34, k = 0; s < total - 26; s += 44, k++) {
    const p = at(s)
    const side = k % 2 ? 1 : -1
    leaves.push({
      transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.angle + side * 58).toFixed(1)}) scale(${(0.85 + (k % 3) * 0.12).toFixed(2)})`,
      delay: delay(s),
    })
  }
  // tendrils leave the stem on alternating sides and curl in ~1.4 turns
  const tendrils = ([[60, 1], [190, -1], [300, 1]] as const).map(([s, side]) => {
    const p = at(s)
    const a = (p.angle * Math.PI) / 180
    const cx = p.x - Math.sin(a) * side * 6.5 + Math.cos(a) * 3.9
    const cy = p.y + Math.cos(a) * side * 6.5 + Math.sin(a) * 3.9
    const a0 = Math.atan2(p.y - cy, p.x - cx)
    const r0 = Math.hypot(p.x - cx, p.y - cy)
    let td = ''
    for (let i = 0; i <= 56; i++) {
      const t = i / 56
      const ang = a0 + side * 1.4 * 2 * Math.PI * t
      const r = r0 * (1 - 0.86 * t)
      td += `${i ? ' L' : 'M'}${(cx + Math.cos(ang) * r).toFixed(1)} ${(cy + Math.sin(ang) * r).toFixed(1)}`
    }
    return { d: td, delay: delay(s) }
  })
  // three berries on short stalks, each with a paper highlight
  const tip = at(total - 2)
  const end = VINE_START + VINE_GROW
  const berries = ([[11, -8, 4.4], [19, 1, 3.8], [7, 6, 3.3]] as const).map(([dx, dy, r], i) => ({
    cx: +(tip.x + dx).toFixed(1),
    cy: +(tip.y + dy).toFixed(1),
    r,
    hx: +(tip.x + dx - r * 0.32).toFixed(1),
    hy: +(tip.y + dy - r * 0.34).toFixed(1),
    hr: +(r * 0.24).toFixed(2),
    delay: `${(end + 0.2 + i * 0.25).toFixed(2)}s`,
  }))
  return {
    d,
    leaves,
    tendrils,
    stalks: berries.map((b) => `M${tip.x.toFixed(1)} ${tip.y.toFixed(1)} L${b.cx} ${b.cy}`).join(' '),
    stalkDelay: `${(end - 0.4).toFixed(1)}s`,
    berries,
  }
})()

// The title draft, the sprig and the frame draw-in are authored paused
// (SSR-safe, no flash) and released via .qc-play once the intro has finished
// drawing the page — or immediately when there is no intro.
const play = ref(false)

// Below lg only the stars outside the title column are shown.
const MOBILE_STARS = [0, 1, 2, 6, 7]

// The astrolabe hand: SSR renders XII and the client eases to the current
// time once the page starts playing, the CSS sweep (.qc-hand-sweep) carrying
// it round from there. Automation (Argos) keeps it at XII so
// screenshots never depend on the clock.
const handDeg = ref(0)
let handTimer: ReturnType<typeof setInterval> | undefined
const setHand = () => {
  const d = new Date()
  handDeg.value = ((d.getHours() % 12) + d.getMinutes() / 60) * 30
}
watch(play, (v) => {
  if (!v || navigator.webdriver) return
  setHand()
  handTimer = setInterval(setHand, 60_000)
})

// Dust motes + shooting star on a canvas layer. Skipped under reduced-motion
// and automation (Argos), and below lg where the canvas is hidden anyway.
const fxEl = ref<HTMLCanvasElement | null>(null)
function startAtmosphere(reduced: boolean) {
  const cv = fxEl.value
  const ctx = cv?.getContext('2d')
  if (!cv || !ctx || reduced || navigator.webdriver || !window.matchMedia('(min-width: 1024px)').matches) return () => {}

  let W = 0
  let H = 0
  const resize = () => {
    const dpr = window.devicePixelRatio || 1
    W = cv.clientWidth
    H = cv.clientHeight
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  let colors = { ink: '#1f1b17', gold: '#8c7853' }
  const readColors = () => {
    const cs = getComputedStyle(document.documentElement)
    colors = { ink: cs.getPropertyValue('--ink').trim(), gold: cs.getPropertyValue('--gold').trim() }
  }
  readColors()

  interface Mote { x: number; y: number; r: number; vy: number; ph: number; sp: number; gold: boolean }
  const motes: Mote[] = Array.from({ length: 46 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.7 + Math.random() * 1.1,
    vy: 5 + Math.random() * 9,
    ph: Math.random() * Math.PI * 2,
    sp: 0.4 + Math.random() * 0.6,
    gold: Math.random() < 0.55,
  }))
  interface Shoot { x: number; y: number; vx: number; vy: number; life: number; trail: [number, number][] }
  let shoot: Shoot | null = null
  let nextShoot = 2.5
  const spark = new Path2D(SPARK)

  let raf = 0
  let t = 0
  let last = performance.now()
  let frames = 0
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    t += dt
    if (++frames % 90 === 0) readColors() // follows light/dark switches
    if (!W || !H) return
    ctx.clearRect(0, 0, W, H)

    for (const m of motes) {
      m.y -= m.vy * dt
      m.x += Math.sin(t * 0.5 + m.ph) * 7 * dt
      if (m.y < -4) {
        m.y = H + 4
        m.x = Math.random() * W
      }
      ctx.globalAlpha = 0.1 + 0.3 * (0.5 + 0.5 * Math.sin(t * m.sp + m.ph))
      ctx.fillStyle = m.gold ? colors.gold : colors.ink
      ctx.beginPath()
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
      ctx.fill()
    }

    if (!shoot && t > nextShoot) {
      shoot = { x: W * 0.56 + Math.random() * W * 0.35, y: 70 + Math.random() * 150, vx: -760, vy: 250, life: 0, trail: [] }
    }
    if (shoot) {
      shoot.life += dt
      shoot.x += shoot.vx * dt
      shoot.y += shoot.vy * dt
      shoot.trail.push([shoot.x, shoot.y])
      if (shoot.trail.length > 34) shoot.trail.shift()
      const fade = shoot.life > 0.95 ? Math.max(0, 1 - (shoot.life - 0.95) / 0.3) : 1
      ctx.strokeStyle = colors.ink
      ctx.lineCap = 'round'
      const tr = shoot.trail
      for (let i = 1; i < tr.length; i++) {
        const k = i / tr.length
        ctx.globalAlpha = 0.55 * k * fade
        ctx.lineWidth = 0.5 + k * 0.9
        ctx.beginPath()
        ctx.moveTo(tr[i - 1]![0], tr[i - 1]![1])
        ctx.lineTo(tr[i]![0], tr[i]![1])
        ctx.stroke()
      }
      ctx.save()
      ctx.translate(shoot.x, shoot.y)
      ctx.rotate(shoot.life * 1.2)
      ctx.scale(0.7, 0.7)
      ctx.translate(-12, -12)
      ctx.globalAlpha = 0.9 * fade
      ctx.strokeStyle = colors.gold
      ctx.lineWidth = 1.4
      ctx.stroke(spark)
      ctx.restore()
      if (shoot.life > 1.25 || shoot.x < -40) {
        shoot = null
        nextShoot = t + 6 + Math.random() * 6
      }
    }
    ctx.globalAlpha = 1
  }
  raf = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }
}

// Constellations on a canvas: one chain at a time is drawn star to star,
// holds, then fades. Reduced-motion / automation get one faint static pass.
const conEl = ref<HTMLCanvasElement | null>(null)
function startConstellations(reduced: boolean) {
  const cv = conEl.value
  const ctx = cv?.getContext('2d')
  if (!cv || !ctx || !window.matchMedia('(min-width: 1024px)').matches) return () => {}
  const animated = !reduced && !navigator.webdriver

  let W = 0
  let H = 0
  let colors = { ink: '#1f1b17', gold: '#8c7853' }
  const readColors = () => {
    const cs = getComputedStyle(document.documentElement)
    colors = { ink: cs.getPropertyValue('--ink').trim(), gold: cs.getPropertyValue('--gold').trim() }
  }

  const chainPts = (idx: number[]) => idx.map((i) => {
    const s = stars[i]!
    return { x: (s.x / 100) * W, y: (s.y / 100) * H, r: s.size / 2 + 4 }
  })

  // draw `p` segments' worth of a chain (p = 1.5 → one full + half of the next)
  const drawChain = (idx: number[], p: number, alpha: number) => {
    const pts = chainPts(idx)
    ctx.strokeStyle = colors.ink
    ctx.lineWidth = 0.9
    ctx.lineCap = 'round'
    ctx.setLineDash([3, 5])
    ctx.globalAlpha = alpha
    for (let k = 0; k < pts.length - 1; k++) {
      const f = Math.min(1, Math.max(0, p - k))
      if (f <= 0) break
      const a = pts[k]!
      const b = pts[k + 1]!
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      const ux = (b.x - a.x) / len
      const uy = (b.y - a.y) / len
      const sx = a.x + ux * a.r
      const sy = a.y + uy * a.r
      const ex = b.x - ux * b.r
      const ey = b.y - uy * b.r
      const e = f * f * (3 - 2 * f) // smoothstep, no hard easing
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + (ex - sx) * e, sy + (ey - sy) * e)
      ctx.stroke()
    }
    ctx.setLineDash([])
  }

  const paintStatic = () => {
    ctx.clearRect(0, 0, W, H)
    for (const c of CHAINS) drawChain(c.idx, c.idx.length - 1, 0.25)
    ctx.globalAlpha = 1
  }

  const resize = () => {
    const dpr = window.devicePixelRatio || 1
    W = cv.clientWidth
    H = cv.clientHeight
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    readColors()
    if (!animated) paintStatic()
  }
  resize()
  window.addEventListener('resize', resize)
  const mo = new MutationObserver(() => {
    readColors()
    if (!animated) paintStatic()
  })
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  let raf = 0
  if (animated) {
    const SEG_TIME = 2.2
    const HOLD = 5
    const FADE = 3
    let ci = 0
    let phase: 'idle' | 'draw' | 'hold' | 'fade' = 'idle'
    let left = 5 // first chain waits out the 3s intro, then the page settles
    let last = performance.now()
    let frames = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (++frames % 90 === 0) readColors()
      left -= dt
      const c = CHAINS[ci]!
      const n = c.idx.length - 1
      ctx.clearRect(0, 0, W, H)
      ctx.globalAlpha = 1
      if (phase === 'idle') {
        if (left <= 0) {
          phase = 'draw'
          left = n * SEG_TIME
        }
        return
      }
      let p = n
      let alpha = 0.55
      if (phase === 'draw') {
        p = n - Math.max(0, left) / SEG_TIME
        if (left <= 0) {
          phase = 'hold'
          left = HOLD
        }
      } else if (phase === 'hold') {
        if (left <= 0) {
          phase = 'fade'
          left = FADE
        }
      } else {
        alpha = 0.55 * Math.max(0, left / FADE)
        if (left <= 0) {
          phase = 'idle'
          left = 5 + Math.random() * 5
          ci = (ci + 1) % CHAINS.length
          return
        }
      }
      drawChain(c.idx, p, alpha)

      // the chart's name for it, set in beside the first star once it's drawn
      if (phase !== 'draw' || p > n - 0.15) {
        const s = chainPts(c.idx)[0]!
        ctx.globalAlpha = alpha * 1.4 * (phase === 'draw' ? Math.min(1, (p - (n - 0.15)) / 0.15) : 1)
        ctx.fillStyle = colors.gold
        ctx.font = '10px ui-monospace, monospace'
        ctx.letterSpacing = '1.5px'
        ctx.fillText(`${c.name}.`, s.x + s.r + 6, s.y - s.r)
      }
      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(frame)
  }

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
    mo.disconnect()
  }
}

// First visit in this session: the page is "hatched in" over ~3s. The reveal
// frontier is the diagonal x + y = k sweeping top-left → bottom-right, and the
// pen strokes back and forth ALONG that frontier (lower-left ↔ upper-right),
// like shading a drawing. Skipped afterwards, for reduced-motion, and under
// automation (Argos/Playwright) so screenshots stay deterministic. Overlay
// starts visible on both server and client to avoid a hydration flash.
const introVisible = ref(true)
const introPlaying = ref(false)
const introEl = ref<HTMLElement | null>(null)
const brushEl = ref<HTMLElement | null>(null)

let stopAtmosphere = () => {}
let stopConstellations = () => {}
let stopIntro = () => {}
onBeforeUnmount(() => {
  stopAtmosphere()
  stopConstellations()
  stopIntro()
  clearInterval(handTimer)
})

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  stopAtmosphere = startAtmosphere(reduced)
  stopConstellations = startConstellations(reduced)

  if (sessionStorage.getItem('qc-intro') || navigator.webdriver || reduced) {
    introVisible.value = false
    play.value = true
    return
  }
  sessionStorage.setItem('qc-intro', '1')
  introPlaying.value = true

  const DURATION = 3000
  const HALF_PASSES = 7 // lower-left → upper-right counts as one pass
  const K_MAX = 2.05 // frontier x + y = k; corner clears just past k = 2
  // PenGlyph tip (6, 94) at size 110
  const TIP_X = 6.6
  const TIP_Y = 103.4
  let raf = 0
  const start = performance.now()

  const done = () => {
    cancelAnimationFrame(raf)
    introVisible.value = false
    introPlaying.value = false
    play.value = true
  }

  const tick = (now: number) => {
    const overlay = introEl.value
    const brush = brushEl.value
    if (!overlay || !brush) return done()
    const t = Math.min((now - start) / DURATION, 1)
    const k = K_MAX * (0.5 - Math.cos(Math.PI * t) / 2)
    overlay.style.clipPath = `polygon(${k * 100}% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${k * 100}%)`
    // frontier segment inside the viewport: A = lower-left end, B = upper-right end
    const ax = Math.max(0, k - 1)
    const ay = Math.min(k, 1)
    const bx = Math.min(k, 1)
    const by = Math.max(0, k - 1)
    const s = 1 - Math.abs(((t * HALF_PASSES) % 2) - 1)
    const x = (ax + (bx - ax) * s) * window.innerWidth
    const y = (ay + (by - ay) * s) * window.innerHeight
    brush.style.transform = `translate(${x - TIP_X}px, ${y - TIP_Y}px)`
    brush.style.opacity = t > 0.88 ? Math.max(0, (1 - t) / 0.12).toFixed(2) : '1'
    if (t >= 1) done()
    else raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  stopIntro = () => cancelAnimationFrame(raf)
})
</script>

<style scoped>
/* gold lozenges on the frame rule and beside the folio cartouche */
.qc-diamond {
  display: block;
  width: 10px;
  height: 10px;
  background: var(--gold);
  transform: rotate(45deg);
}
.qc-diamond-sm {
  display: block;
  width: 7px;
  height: 7px;
  background: var(--gold);
  transform: rotate(45deg);
  opacity: 0.85;
}

/* four-point sparks twinkle, each at its own tempo (--tw) */
.qc-star {
  animation: qc-twinkle var(--tw, 5s) ease-in-out var(--ds, 0s) infinite;
}
@keyframes qc-twinkle {
  0%,
  100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.9;
  }
}

.qc-grain {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.05;
}

/* first-load draw-in brush; position is driven per-frame from script
   (transform tracks the clip frontier, tip-aligned) */
.qc-intro-brush {
  will-change: transform;
}

/* --- title: pen-traced Mincho outlines -----------------------------------
   Each letter is a <tspan> with its own --d (0.13s apart, reading order):
   the outline dash-draws in 0.55s, then the fill soaks in 0.45s later. The
   last of 19 letters settles ≈4s in. Authored paused so SSR shows a blank
   title with no flash; .qc-play (set once the intro is done) releases it. */
.qc-glyphs {
  font-family: 'Shippori Mincho', serif;
  font-weight: 600;
  font-size: 96px;
  fill: var(--ink);
  stroke: var(--ink);
  stroke-width: 0.9;
  stroke-linejoin: round;
  paint-order: stroke;
}
.qc-glyphs tspan {
  fill-opacity: 0;
  stroke-dasharray: 900;
  stroke-dashoffset: 900;
  animation:
    qc-draw 0.55s cubic-bezier(0.4, 0, 0.3, 1) var(--d, 0s) forwards paused,
    qc-soak 0.9s ease calc(var(--d, 0s) + 0.45s) forwards paused;
}
@keyframes qc-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes qc-soak {
  to {
    fill-opacity: 1;
  }
}

/* --- sprig: stem draws over 4.4s, each leaf unfurls when the stem reaches it,
   its vein and hatching (and each tendril) half a second later, the stalks
   and berries once the tip arrives ----------------------------------------- */
.qc-stem {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: qc-draw 4.4s cubic-bezier(0.45, 0, 0.25, 1) 1.8s forwards paused;
}
.qc-leaf {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transform: scale(0);
  transform-origin: 0 0;
  animation:
    qc-draw 1s ease-out var(--d) forwards paused,
    qc-unfurl 1.1s cubic-bezier(0.2, 0.8, 0.3, 1) var(--d) forwards paused;
}
.qc-vein {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: qc-draw 0.8s ease-out calc(var(--d) + 0.5s) forwards paused;
}
.qc-berry {
  opacity: 0;
  animation: qc-berry 1.2s ease-out var(--d) forwards paused;
}
@keyframes qc-unfurl {
  to {
    transform: scale(1);
  }
}
@keyframes qc-berry {
  to {
    opacity: 1;
  }
}

/* --- frame draw-in -------------------------------------------------------
   rules scale out from the corners 0.9s → 3.3s; the sigil arcs, glyphs and
   triangle circle are pen-drawn in turn (--i); diamonds, cartouche and the
   sigils' gold eyes fade in as the rules meet; the spell bands follow once
   everything has arrived. */
.qc-rule {
  position: absolute;
  background: var(--ink);
  opacity: 0.4;
}
.qc-rule-h {
  width: 50%;
  height: 1.5px;
  transform: scaleX(0);
  animation: qc-extend-x 2.4s cubic-bezier(0.45, 0, 0.25, 1) 0.9s forwards paused;
}
.qc-rule-v {
  width: 1.5px;
  height: 50%;
  transform: scaleY(0);
  animation: qc-extend-y 2.4s cubic-bezier(0.45, 0, 0.25, 1) 0.9s forwards paused;
}
@keyframes qc-extend-x {
  to {
    transform: scaleX(1);
  }
}
@keyframes qc-extend-y {
  to {
    transform: scaleY(1);
  }
}

.qc-draw-in {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0;
  animation: qc-draw-in 1.4s ease-out calc(0.9s + var(--i, 0) * 0.16s) forwards paused;
}
@keyframes qc-draw-in {
  1% {
    opacity: var(--o, 0.5);
  }
  to {
    stroke-dashoffset: 0;
    opacity: var(--o, 0.5);
  }
}
.qc-fill-in {
  opacity: 0;
  animation: qc-fill-in 0.9s ease 3s forwards paused;
}
@keyframes qc-fill-in {
  to {
    opacity: var(--o, 1);
  }
}

/* spell bands: a glyph every 48px above a hairline (the qc-band-* patterns
   carry their own alpha), hanging inward from the rule and fading out
   toward the corners */
.qc-scale {
  position: absolute;
  opacity: 0;
  animation: qc-scale-in 1.4s ease 2.8s forwards paused;
}
@keyframes qc-scale-in {
  to {
    opacity: 1;
  }
}
.qc-scale-top,
.qc-scale-bottom {
  left: 96px;
  right: 96px;
  height: 9px;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
}
.qc-scale-top {
  top: 1.5px;
}
.qc-scale-bottom {
  bottom: 1.5px;
}
.qc-scale-left,
.qc-scale-right {
  top: 96px;
  bottom: 96px;
  width: 9px;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent);
}
.qc-scale-left {
  left: 1.5px;
}
.qc-scale-right {
  right: 1.5px;
}
/* the tiles are drawn for the top and left rules; mirror them so the
   hairline sits inside the glyphs on the other two sides as well */
.qc-scale-bottom svg {
  transform: scaleY(-1);
}
.qc-scale-right svg {
  transform: scaleX(-1);
}

.qc-play .qc-glyphs tspan,
.qc-play .qc-stem,
.qc-play .qc-leaf,
.qc-play .qc-vein,
.qc-play .qc-berry,
.qc-play .qc-rule-h,
.qc-play .qc-rule-v,
.qc-play .qc-draw-in,
.qc-play .qc-fill-in,
.qc-play .qc-scale,
.qc-play .qc-hand-sweep {
  animation-play-state: running;
}

/* --- ambient: rete turns, hand eases to the hour, candle breathes -------- */
.qc-astro-rete {
  animation: qc-spin 32s linear infinite reverse;
}
.qc-hand {
  transition: transform 3.2s cubic-bezier(0.3, 0.6, 0.2, 1);
}
/* released with .qc-play, together with the ease to the hour: the ease
   settles into the sweep instead of stopping and restarting */
.qc-hand-sweep {
  animation: qc-spin 32s linear infinite paused;
}
@keyframes qc-spin {
  to {
    transform: rotate(360deg);
  }
}
.qc-candle {
  background: radial-gradient(
    ellipse 62% 52% at 50% 108%,
    color-mix(in srgb, var(--gold) 22%, transparent),
    transparent 70%
  );
  animation: qc-breath 7s ease-in-out infinite;
}
/* the seal under the title glows and dims on its own, deeper than the
   candle (own keyframes, qc-breath is shared with it), while its glyph ring
   turns once a minute. The base rule is the lit state, so automation and
   reduced-motion get a steady soft glow. */
.qc-fleuron {
  filter: drop-shadow(0 0 5px color-mix(in srgb, var(--gold) 70%, transparent));
  animation: qc-fleuron 5s ease-in-out infinite;
}
.qc-seal-ring {
  animation: qc-spin 60s linear infinite;
}
@keyframes qc-fleuron {
  0%,
  100% {
    opacity: 0.25;
    filter: drop-shadow(0 0 0 color-mix(in srgb, var(--gold) 0%, transparent));
  }
  50% {
    opacity: 1;
  }
}
@keyframes qc-breath {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .qc-star,
  .qc-glyphs tspan,
  .qc-stem,
  .qc-leaf,
  .qc-vein,
  .qc-berry,
  .qc-astro-rete,
  .qc-hand-sweep,
  .qc-candle,
  .qc-fleuron,
  .qc-seal-ring {
    animation: none;
  }
  .qc-hand {
    transition: none;
  }
  /* resting states: inked title, finished sprig and frame, steady candle */
  .qc-glyphs tspan {
    fill-opacity: 1;
    stroke-dashoffset: 0;
  }
  .qc-stem,
  .qc-leaf,
  .qc-vein {
    stroke-dashoffset: 0;
  }
  .qc-leaf {
    transform: none;
  }
  .qc-berry {
    opacity: 1;
  }
  .qc-candle {
    opacity: 0.8;
  }
  .qc-fleuron {
    opacity: 0.85;
  }
  .qc-rule-h,
  .qc-rule-v {
    animation: none;
    transform: none;
  }
  .qc-draw-in {
    animation: none;
    stroke-dashoffset: 0;
    opacity: var(--o, 0.5);
  }
  .qc-fill-in {
    animation: none;
    opacity: var(--o, 1);
  }
  .qc-scale {
    animation: none;
    opacity: 1;
  }
}
</style>
