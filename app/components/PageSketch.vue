<template>
  <!-- a pen-and-wash vignette for a page's empty margin, in the homepage's
       atelier hand: ink outlines and hatching over loose watercolour washes in
       the palette tokens. The washes fade in first; each stroke then draws
       itself in, in order; a dashed stroke is revealed through a mask drawn
       the same way. -->
  <svg
    :width="sketch.w"
    :height="sketch.h"
    :viewBox="`0 0 ${sketch.w} ${sketch.h}`"
    class="pointer-events-none select-none max-w-full h-auto"
    :class="{ 'ps-still': still }"
    fill="none"
    stroke="var(--ink)"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <defs>
      <!-- the homepage's wc-bleed (BgWatercolor), scaled to objects a few
           dozen px across: wet edges, pooled pigment, granulation -->
      <filter :id="`${uid}-bleed`" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="7" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="9" xChannelSelector="R" yChannelSelector="G" result="wet" />
        <feGaussianBlur in="wet" stdDeviation="0.5" result="soft" />
        <feColorMatrix in="warp" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1.4 0 -0.05" result="pool" />
        <feComposite in="soft" in2="pool" operator="in" result="pooled" />
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="2" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.6 0 0 0 0.62" result="tooth" />
        <feComposite in="pooled" in2="tooth" operator="in" />
      </filter>
    </defs>
    <!-- each wash is stroked in its own colour, so the pigment dries darker
         along the rim -->
    <g class="ps-fade" style="--d: 0.2s">
      <g class="ps-wash" :filter="`url(#${uid}-bleed)`" stroke-width="1.2">
        <path
          v-for="(w, i) in washes"
          :key="i"
          :d="w.d"
          :transform="w.t"
          :fill="`var(--${w.c})`"
          :fill-opacity="w.o"
          :stroke="`var(--${w.c})`"
          :stroke-opacity="w.o * 1.3"
        />
      </g>
    </g>
    <template v-for="([d, k, t], i) in sketch.paths" :key="i">
      <g v-if="k === 'r'" :transform="t">
        <mask :id="`${uid}-${i}`" maskUnits="userSpaceOnUse">
          <path :d="d" class="ps-draw" pathLength="1" stroke="#fff" stroke-width="8" :style="{ '--d': delay(i) }" />
        </mask>
        <path :d="d" v-bind="STYLE.r" :mask="`url(#${uid}-${i})`" />
      </g>
      <path
        v-else
        :d="d"
        :transform="t"
        :class="k === 'G' ? 'ps-fade' : 'ps-draw'"
        pathLength="1"
        v-bind="STYLE[k]"
        :style="{ '--d': delay(i) }"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
type Kind = 'about' | 'projects' | 'journal' | 'skills' | 'journey' | 'contact' | 'guestbook'
// l outline · s secondary line · h hatching · g gold line · G gold dot · r dashed line
// · n node (an outline filled with the page colour, hiding the road under it)
type Weight = 'l' | 's' | 'h' | 'g' | 'G' | 'r' | 'n'
// a watercolour wash: palette token and fill opacity, e.g. 'cool 0.24'
type Tint = `${'warm' | 'cool' | 'gold' | 'herb' | 'ink2'} ${number}`
// a stroke with a tint also washes the shape it outlines (an open path
// closes itself for the fill)
type Stroke = [d: string, k: Weight, t?: string, wash?: Tint]
// colour with no line of its own: a tabletop, a shadow, a splash
type Wash = [d: string, tint: Tint, t?: string]

const props = defineProps<{ kind: Kind }>()
const uid = useId()
// screenshot runs get the finished drawing: Chrome replays SVG CSS animations
// when it captures a page taller than the viewport (Argos shoots full page)
const still = ref(false)
onMounted(() => {
  still.value = navigator.webdriver
})

const STYLE: Record<Weight, Record<string, string | number>> = {
  l: { 'stroke-width': 0.9, opacity: 0.45 },
  s: { 'stroke-width': 0.65, opacity: 0.32 },
  h: { 'stroke-width': 0.5, opacity: 0.22 },
  g: { stroke: 'var(--gold)', 'stroke-width': 0.8, opacity: 0.75 },
  G: { fill: 'var(--gold)', stroke: 'none', 'fill-opacity': 0.8 },
  r: { 'stroke-width': 0.8, opacity: 0.4, 'stroke-dasharray': '3 5' },
  n: { 'stroke-width': 0.9, 'stroke-opacity': 0.45, fill: 'var(--bg)' },
}
// a busy sketch gets a shorter step, so the last stroke still starts by ~2.3s
const step = computed(() => Math.min(0.05, 2 / sketch.value.paths.length))
const delay = (i: number) => `${(0.35 + i * step.value).toFixed(2)}s`

const n = (v: number) => v.toFixed(1)
// a circle as a path, so it can draw in like every other stroke
const ring = (x: number, y: number, r: number) =>
  `M${n(x - r)} ${n(y)} a${r} ${r} 0 1 0 ${n(2 * r)} 0 a${r} ${r} 0 1 0 ${n(-2 * r)} 0`
// the homepage spell-band glyphs
const GLYPH = {
  circ: 'M1.7 0 A1.7 1.7 0 1 1 -1.7 0 A1.7 1.7 0 1 1 1.7 0',
  tri: 'M0 -2.3 L2.1 1.5 L-2.1 1.5 Z',
  wave: 'M-2.8 0 C -2 -1.9 -0.8 -1.9 0 0 C 0.8 1.9 2 1.9 2.8 0',
}
const glyph = (g: keyof typeof GLYPH, x: number, y: number, rot = 0, sc = 1): Stroke =>
  [GLYPH[g], 's', `translate(${x} ${y}) rotate(${rot}) scale(${sc})`]
// old-map mountains, one peak per [x, base y, height]: outlines, then hatching
// down the shaded right slopes
const peaks = (list: [number, number, number][], k: Weight, wash?: Tint): Stroke[] => [
  [list.map(([x, y, h]) => `M${n(x - h * 0.75)} ${y} L${x} ${y - h} L${n(x + h * 0.75)} ${y}`).join(' '), k, undefined, wash],
  [list.map(([x, y, h]) => [0.3, 0.55, 0.8].map((f) =>
    `M${n(x + h * 0.75 * f)} ${n(y - h * (1 - f))} L${n(x + h * 0.75 * f * 0.55)} ${y}`).join(' ')).join(' '), 'h'],
]
const pines = (list: [number, number][]) =>
  list.map(([x, y]) => `M${x} ${y} L${x - 7} ${y + 14} H${x + 7} Z M${x} ${y + 14} V${y + 19}`).join(' ')
// a windmill sail from its hub at (0 0), pointing up-left
const SAIL = 'M0 0 L-14 -14 M-5.6 -5.6 L-3.5 -7.7 L-11.9 -16.1 L-14 -14'
// the cursor quill (PenGlyph), barrel to tip of the vane
const QUILL: [string, Weight][] = [
  ['M20 -3.8 L44 -2.8 L44 2.8 L20 3.8 Z', 's'],
  ['M42 -2.4 C 52 -10 64 -15.5 76 -17 L80 -12.5 L84 -18.2 C 98 -19.5 114 -15 122 -8 Q 126 -4 127 -1 C 124 4 110 9.5 94 10.5 C 76 11.5 56 8 44 2.6 Z', 'l'],
  ['M44 0 C 70 -0.4 100 -1 125 -1.4', 's'],
  ['M58 -0.2 L66 -9.5 M74 -0.5 L82 -9.8 M96 -0.9 L104 -13.3 M112 -1.2 L120 -8 M60 -0.3 L67 7.2 M76 -0.6 L83 7.9 M92 -0.8 L99 7.2 M108 -1.1 L115 5.3', 'h'],
]

const SKETCHES: Record<Kind, { w: number; h: number; paths: Stroke[]; washes?: Wash[] }> = {
  // away from screens: a teapot, a cup still steaming, two small ceramics
  about: {
    w: 380,
    h: 160,
    paths: [
      ['M0 150 H380', 'l'],
      ['M14 156 H366', 'h'],
      ['M68 150 C 52 140 50 112 66 100 C 80 90 130 90 144 100 C 160 112 158 140 142 150 Z', 'l', undefined, 'cool 0.24'],
      ['M55 125 C 44 122 37 108 30 96 L36 93 C 42 101 49 109 57 112', 'l', undefined, 'cool 0.24'],
      ['M150 106 C 172 104 176 136 152 138 M150 112 C 164 112 166 130 151 132', 'l'],
      ['M82 98 C 88 89 122 89 128 98', 's', undefined, 'cool 0.3'],
      ['M98 91 C 98 84 112 84 112 91', 's'],
      ['M55 121 C 80 128 130 128 156 121', 's'],
      glyph('circ', 84, 134),
      glyph('wave', 105, 135),
      glyph('circ', 126, 134),
      ['M126 142 L134 132 M133 146 L142 135 M140 147 L149 137', 'h'],
      [ring(105, 83, 2.2), 'G'],
      ['M184 126 C 184 121 228 121 228 126 C 228 131 184 131 184 126', 'l', undefined, 'gold 0.4'],
      ['M184 126 C 185 141 192 147 206 147 C 220 147 227 141 228 126', 'l', undefined, 'warm 0.26'],
      ['M227 131 C 239 130 239 144 223 144', 's'],
      ['M170 150 C 172 146 240 146 242 150', 's', undefined, 'warm 0.2'],
      ['M199 116 C 193 108 205 101 199 93 C 194 86 202 80 199 74', 's'],
      ['M213 114 C 208 107 218 100 213 92 C 209 86 215 81 212 77', 's'],
      ['M282 86 C 283 100 280 108 274 116 C 264 130 268 148 278 150 L298 150 C 308 148 312 130 302 116 C 296 108 293 100 294 86', 'l', undefined, 'gold 0.24'],
      ['M279 86 H297', 'l'],
      ['M271 124 C 280 128 296 128 305 124', 's'],
      glyph('tri', 288, 138),
      ['M288 86 C 287 72 291 58 300 44', 's'],
      ['M290 72 C 283 68 279 62 281 55 C 287 59 291 65 290 72', 's', undefined, 'herb 0.45'],
      ['M295 56 C 302 54 308 48 309 41 C 302 43 297 49 295 56', 's', undefined, 'herb 0.45'],
      [ring(300, 40, 2.4), 'G'],
      [ring(294, 35, 1.8), 'G'],
      ['M331 150 C 322 144 322 127 333 120 L331 113 H359 L357 120 C 368 127 368 144 359 150 Z', 'l', undefined, 'warm 0.24'],
      ['M326 133 C 336 137 354 137 364 133', 's'],
      ['M330 141 L335 146 M338 141 L343 146 M346 141 L351 146 M354 141 L359 146', 'h'],
    ],
    washes: [
      ['M2 151 C 100 149 280 149 378 151 L376 156 C 260 158 110 158 4 156 Z', 'gold 0.18'],
      ['M122 100 C 142 104 154 122 147 140 C 143 146 133 148 125 147 C 135 132 135 114 122 100 Z', 'cool 0.14'],
      [ring(168, 66, 2.6), 'cool 0.3'],
      [ring(252, 58, 1.8), 'warm 0.3'],
    ],
  },
  // a compass caught drawing a magic circle, a rule beside it
  projects: {
    w: 380,
    h: 150,
    paths: [
      ['M79.1 107.6 A118 118 0 0 1 292.2 89', 'l'],
      ['M292.2 89 A118 118 0 0 1 306.9 131.6', 'r'],
      ['M103.4 98 A100 100 0 0 1 266.6 83.7', 's'],
      glyph('circ', 106.5, 77.9, -50),
      glyph('tri', 135.5, 53.6, -30),
      glyph('wave', 171.1, 40.7, -10),
      glyph('tri', 208.9, 40.7, 10),
      glyph('circ', 244.5, 53.6, 30),
      ['M214.8 76.1 L192.4 138.2 L190 148 L194.6 139 L219.4 77.9', 'l', undefined, 'ink2 0.25'],
      ['M217.5 74.5 L272.7 83.8 L292.2 89 L272.1 87.8 L216.7 79.5', 'l', undefined, 'warm 0.35'],
      ['M271.1 81.5 L269.9 89.5', 's'],
      ['M206.4 105 A30 30 0 0 0 246.7 81.7', 's'],
      ['M212.9 73.7 L206.4 62.4 L209.8 60.4 L216.3 71.7', 'l', undefined, 'gold 0.4'],
      [ring(217.1, 77, 5), 'l', undefined, 'gold 0.35'],
      [ring(217.1, 77, 1.8), 'G'],
      ['M2 134 H140 V146 H2 Z', 's', undefined, 'gold 0.3'],
      [Array.from({ length: 22 }, (_, k) => `M${8 + k * 6} 134 v${k % 5 ? 3 : 6}`).join(' '), 'h'],
    ],
    washes: [
      ['M79.1 107.6 A118 118 0 0 1 292.2 89 L266.6 83.7 A100 100 0 0 0 103.4 98 Z', 'gold 0.28'],
      [ring(318, 108, 2.2), 'cool 0.3'],
      [ring(60, 92, 1.8), 'warm 0.3'],
    ],
  },
  // a stack of notebooks, a candle on top, an hourglass for the reading time
  journal: {
    w: 360,
    h: 180,
    paths: [
      ['M298 156 H50 C 44 156 41 160 41 166 C 41 172 44 176 50 176 H298 Z', 'l', undefined, 'warm 0.26'],
      ['M62 156 V176 M67 156 V176', 's'],
      ['M262 160 H294 M262 164 H295 M262 168 H295 M262 172 H294', 'h'],
      ['M280 138 H70 C 64 138 61 142 61 147 C 61 152 64 156 70 156 H280 Z', 'l', undefined, 'cool 0.24'],
      ['M84 138 V156 M89 138 V156', 's'],
      ['M150 142 H200 V152 H150 Z', 's', undefined, 'gold 0.3'],
      ['M246 142 H276 M246 147 H277 M246 152 H276', 'h'],
      ['M50 120 H252 C 258 120 261 124 261 129 C 261 134 258 138 252 138 H50 Z', 'l', undefined, 'herb 0.28'],
      ['M235 120 V138 M240 120 V138', 's'],
      ['M54 124 H84 M54 129 H85 M54 134 H84', 'h'],
      ['M120 138 L121 160 L117 156 L113 160 L114 138', 'g', undefined, 'warm 0.5'],
      ['M120 120 C 122 115 178 115 180 120', 's', undefined, 'gold 0.3'],
      ['M141 117 V72 M159 117 V74', 'l'],
      ['M141 72 C 146 70 154 76 159 74', 'l'],
      ['M146 73 C 146 80 149 82 148 88', 's'],
      ['M150 73 L151 66', 'l'],
      ['M151 66 C 144 58 146 48 151 38 C 156 48 158 58 151 66', 'g', undefined, 'gold 0.5'],
      ['M151 61 C 148 56 149 51 151 47', 'g'],
      ['M151 26 V20 M170 34 L175 29 M132 34 L127 29 M176 52 H182 M126 52 H120', 'g'],
      ['M314 100 H350 M314 176 H350 M317 100 V176 M347 100 V176', 's'],
      ['M322 104 C 322 124 332 132 332 138 C 332 144 322 152 322 172 H342 C 342 152 332 144 332 138 C 332 132 342 124 342 104 Z', 'l', undefined, 'cool 0.12'],
      ['M326 118 C 330 122 334 122 338 118 M324 170 C 328 160 336 160 340 170 M332 140 V164', 'g', undefined, 'gold 0.45'],
    ],
    washes: [
      ['M141 117 V72 C 146 70 154 76 159 74 V117 Z', 'gold 0.14'],
      ['M314 98 H350 V103 H314 Z M314 173 H350 V178 H314 Z', 'gold 0.3'],
      [ring(206, 84, 2), 'cool 0.3'],
      [ring(298, 112, 1.6), 'herb 0.3'],
    ],
  },
  // the toolbox as an atelier shelf: brushes in a jar, inks at different
  // levels, a mortar and pestle
  skills: {
    w: 640,
    h: 170,
    paths: [
      ['M0 160 H640', 'l'],
      ['M4 166 H636', 's'],
      ['M38 100 L42 159 H90 L94 100', 'l', undefined, 'cool 0.2'],
      ['M34 100 H98', 'l'],
      ['M40 118 H92', 's'],
      ['M54 100 L46 50 M68 100 L70 42 M82 100 L96 50', 's'],
      ['M46 50 C 41 44 41 34 43 26 C 48 33 51 43 46 50', 'l', undefined, 'warm 0.45'],
      ['M70 42 C 65 35 66 24 70 16 C 74 24 75 35 70 42', 'l', undefined, 'cool 0.45'],
      ['M96 50 C 93 43 95 33 100 27 C 102 35 101 44 96 50', 'l', undefined, 'herb 0.45'],
      ['M146 159 C 128 155 124 126 140 116 L148 110 V100 H172 V110 L180 116 C 196 126 192 155 174 159 Z', 'l', undefined, 'ink2 0.12'],
      ['M150 100 V90 C 150 87 170 87 170 90 V100', 'l'],
      ['M144 118 H176 V130 H144 Z', 's', undefined, 'gold 0.3'],
      glyph('tri', 160, 124),
      ['M131 134 C 145 138 175 138 189 134', 'g'],
      ['M136 150 L146 140 M146 154 L158 142 M158 155 L170 143 M170 154 L180 144 M181 150 L187 144', 'h'],
      ['M236 159 V96 L244 84 V66 H256 V84 L264 96 V159 Z', 'l', undefined, 'ink2 0.1'],
      ['M242 66 V58 H258 V66', 'l'],
      ['M236 112 H264', 'g'],
      ['M237 122 L246 113 M237 134 L258 113 M237 146 L263 120 M240 158 L263 134 M252 158 L263 147', 'h'],
      ['M332 106 V84 H348 V106 C 372 112 380 146 360 159 H320 C 300 146 308 112 332 106 Z', 'l', undefined, 'ink2 0.1'],
      ['M334 84 V76 C 334 73 346 73 346 76 V84', 'l'],
      ['M311 132 C 325 136 355 136 369 132', 'g'],
      ['M314 146 L326 134 M322 154 L340 136 M336 157 L356 137 M350 157 L366 141', 'h'],
      glyph('circ', 330, 124, 0, 0.7),
      glyph('circ', 350, 119, 0, 0.5),
      [ring(330, 66, 1.6), 'G'],
      [ring(352, 60, 1.3), 'G'],
      [ring(341, 50, 1.1), 'G'],
      ['M418 112 V152 C 418 160 432 160 432 152 V112', 'l', undefined, 'ink2 0.1'],
      ['M415 112 H435', 'l'],
      ['M419 112 V104 H431 V112', 'l'],
      ['M418 132 H432', 'g'],
      ['M419 140 L431 134 M419 148 L431 142 M421 155 L431 150', 'h'],
      ['M484 128 H596 M486 128 C 488 150 506 159 540 159 C 574 159 592 150 594 128', 'l', undefined, 'ink2 0.2'],
      ['M492 140 C 512 146 568 146 588 140', 's'],
      ['M548 126 L598 84 C 602 80 608 84 604 90 L556 130', 'l', undefined, 'gold 0.3'],
      ['M560 152 L570 144 M570 154 L580 146 M580 150 L586 146', 'h'],
    ],
    washes: [
      ['M0 160 H640 V166 H0 Z', 'gold 0.2'],
      ['M131 134 C 145 138 175 138 189 134 C 192 148 186 157 174 159 H146 C 134 157 128 148 131 134 Z', 'cool 0.3'],
      ['M236 112 H264 V159 H236 Z', 'warm 0.32'],
      ['M311 132 C 325 136 355 136 369 132 C 371 145 367 154 360 159 H320 C 313 154 309 145 311 132 Z', 'herb 0.34'],
      ['M418 132 H432 V152 C 432 160 418 160 418 152 Z', 'gold 0.45'],
      ['M494 132 C 512 138 568 138 586 132 C 576 128 504 128 494 132 Z', 'herb 0.4'],
      [ring(212, 70, 2.2), 'warm 0.3'],
      [ring(462, 84, 1.8), 'cool 0.3'],
    ],
  },
  // the timeline as a small map: a switchback mountain road climbs from a
  // village (bottom left) to the hat-roofed tower (top right), past a few
  // mountains of different sizes; nodes on the road branch off to buildings
  // on either side: a windmill, a chapel, an inn, a cabin. The tower and the
  // compass rose come last
  journey: {
    w: 600,
    h: 690,
    paths: [
      ['M14 662 V640 L26 628 L38 640 V662 Z M42 662 V636 L53 624 L64 636 V662 Z', 'l', undefined, 'gold 0.2'],
      ['M23 662 V654 H29 V662 M50 662 V655 H56 V662 M57 640 H61 V645 H57 Z M32 634 V625 H35 V637 M6 663 H74', 's'],
      ['M33.5 622 c -3 -4 3 -6 0 -10 c -3 -4 3 -6 0 -10', 'h'],
      ['M470 672 H570 V678 H470 Z M495 672 V678 M520 672 V678 M545 672 V678', 's'],
      [[472, 478, 484, 490, 522, 528, 534, 540].map((x) => `M${x} 678 L${x + 5} 672`).join(' '), 'h'],
      ['M78 300 L118 246 L132 258 L156 216 L222 300', 'l', undefined, 'ink2 0.14'],
      ['M147 232 L152 236 L157 231 L162 236 L168.6 232', 's'],
      ['M172 238 L166 258 M186 254 L179 276 M199 271 L193 292 M212 288 L209 299 M124 252 L120 270', 'h'],
      ['M398 420 L442 362 L456 372 L478 330 L500 352 L512 344 L548 420', 'l', undefined, 'ink2 0.14'],
      ['M466 352 L471 356 L476 351 L481 356 L486 352', 's'],
      ['M486 340 L480 360 M498 356 L490 380 M518 360 L510 388 M530 384 L524 410 M540 402 L537 418', 'h'],
      ...peaks([[120, 140, 38], [40, 470, 26], [380, 580, 46]], 's', 'ink2 0.12'),
      ['M90 490 V468 L104 456 L118 468 V490 Z M118 490 V460 H128 V490', 'l', undefined, 'gold 0.22'],
      ['M117 460 L123 446 L129 460 M123 446 V440 M120.5 442.5 H125.5 M101 490 V482 C 101 478 107 478 107 482 V490 M84 491 H134', 's'],
      ['M222 622 C 242 606 284 606 302 620', 's', undefined, 'herb 0.3'],
      ['M254 608 L258 580 H266 L270 608 Z', 'l', undefined, 'gold 0.3'],
      ['M256 580 L262 572 L268 580 M260 608 V602 C 260 599 264 599 264 602 V608', 's', undefined, 'warm 0.4'],
      ...[0, 90, 180, 270].map((a): Stroke => [SAIL, 's', `translate(262 576) rotate(${a})`]),
      [ring(262, 576, 1.6), 'G'],
      ['M352 470 V450 L368 436 L384 450 V470 Z', 'l', undefined, 'warm 0.24'],
      ['M365 470 V461 H371 V470 M356 454 H361 V459 H356 Z M375 454 H380 V459 H375 Z M346 471 H390', 's'],
      ['M292 256 V238 L306 226 L320 238 V256 Z', 'l', undefined, 'gold 0.26'],
      ['M302 256 V249 H308 V256 M313 232 V224 H316 V234 M286 257 H326', 's'],
      [pines([[196, 326], [210, 338], [440, 500], [456, 512], [458, 246]]), 's', undefined, 'herb 0.4'],
      ['M80 650 C 116 640 146 634 158 612 C 176 588 110 566 124 540 C 138 514 210 522 240 500 C 266 480 206 452 222 428 C 238 404 306 414 330 392 C 352 372 290 340 304 318 C 318 296 384 304 404 282 C 422 262 370 238 384 216 C 396 198 420 190 430 178', 'r'],
      // spurs from the road's nodes to the windmill, chapel, inn and cabin
      ['M158 612 C 186 604 220 606 250 610 M124 540 C 118 524 108 508 104 494 M330 392 C 332 420 338 452 348 468 M304 318 C 302 296 306 276 305 260', 'r'],
      [[[158, 612], [124, 540], [330, 392], [304, 318]].map(([x, y]) => ring(x!, y!, 3.5)).join(' '), 'n'],
      [ring(80, 650, 4), 'n'],
      ['M380 186 C 404 175 456 175 480 186', 's'],
      ['M236 132 V84 H264 V132', 'l', 'translate(180 46)', 'gold 0.24'],
      ['M228 84 H272 M232 84 C 240 70 246 52 248 34 C 249 26 254 20 262 18 C 256 24 254 30 256 40 C 258 56 262 72 268 84', 'l', 'translate(180 46)', 'cool 0.34'],
      ['M236 76 C 246 79 256 79 266 76', 's', 'translate(180 46)'],
      ['M245 132 V122 C 245 116 255 116 255 122 V132', 's', 'translate(180 46)'],
      ['M246 106 V99 C 246 94 254 94 254 99 V106 Z', 's', 'translate(180 46)'],
      ['M236 112 H244 M256 116 H264 M240 122 H246', 'h', 'translate(180 46)'],
      [ring(448, 58, 1.8), 'G'],
      [ring(535, 95, 40), 'l'],
      [ring(535, 95, 33), 's', undefined, 'cool 0.1'],
      ['M400 30 L407 73 L400 80 L393 73 Z M400 130 L407 87 L400 80 L393 87 Z M450 80 L407 87 L400 80 L407 73 Z M350 80 L393 73 L400 80 L393 87 Z', 'l', 'translate(135 15)', 'gold 0.3'],
      ['M424 56 L376 104 M376 56 L424 104', 's', 'translate(135 15)'],
      [Array.from({ length: 16 }, (_, k) => k).filter((k) => k % 4).map((k) => {
        const [c, s] = [Math.cos((k * Math.PI) / 8), Math.sin((k * Math.PI) / 8)]
        return `M${n(535 + 43 * c)} ${n(95 + 43 * s)} L${n(535 + 47 * c)} ${n(95 + 47 * s)}`
      }).join(' '), 'h'],
      glyph('tri', 535, 36),
      [ring(535, 95, 2.4), 'G'],
    ],
    washes: [
      ['M14 640 L26 628 L38 640 Z M42 636 L53 624 L64 636 Z', 'warm 0.4'],
      ['M156 216 L222 300 H182 C 178 270 170 240 156 216 Z', 'cool 0.14'],
      ['M478 330 L500 352 L512 344 L548 420 H504 C 500 388 492 356 478 330 Z', 'cool 0.14'],
      ['M90 468 L104 456 L118 468 Z', 'cool 0.3'],
      ['M400 30 L407 73 L400 80 L393 73 Z', 'warm 0.4', 'translate(135 15)'],
      [ring(342, 548, 2.2), 'cool 0.3'],
      [ring(196, 170, 1.8), 'warm 0.3'],
    ],
  },
  // say hello, or send a postcard: an envelope sealed with a sigil, and a
  // postcard, stamped and franked
  contact: {
    w: 520,
    h: 190,
    paths: [
      ['M20 34 H230 V170 H20 Z', 'l', 'rotate(-5 125 102)', 'gold 0.14'],
      ['M20 34 L125 108 L230 34', 'l', 'rotate(-5 125 102)', 'gold 0.1'],
      ['M20 170 L98 112 M230 170 L152 112', 's', 'rotate(-5 125 102)'],
      [ring(125, 108, 15), 'g', 'rotate(-5 125 102)', 'warm 0.5'],
      [ring(125, 108, 10), 'g', 'rotate(-5 125 102)'],
      ['M125 98 L133.7 113 L116.3 113 Z', 'g', 'rotate(-5 125 102)'],
      [ring(125, 108, 1.6), 'G', 'rotate(-5 125 102)'],
      ['M270 28 H490 V168 H270 Z', 'l', 'rotate(4 380 98)'],
      ['M380 44 V152', 's', 'rotate(4 380 98)'],
      ['M284 60 c 8 -6 12 6 20 0 s 12 -6 20 0 s 12 6 20 0 s 12 -6 20 0 M284 80 c 8 -6 12 6 20 0 s 12 -6 20 0 s 12 6 20 0 s 12 -6 20 0 M284 100 c 8 -6 12 6 20 0 s 12 -6 20 0 s 12 6 20 0 M284 120 c 8 -6 12 6 20 0 s 12 -6 20 0', 'h', 'rotate(4 380 98)'],
      ['M326 140 C 330 130 338 132 334 140 C 330 148 342 146 348 138 C 352 134 356 140 362 138', 's', 'rotate(4 380 98)'],
      ['M444 40 H476 V78 H444 Z', 'l', 'rotate(4 380 98)', 'gold 0.2'],
      ['M448 44 H472 V74 H448 Z', 's', 'rotate(4 380 98)', 'cool 0.26'],
      ['M450 70 L458 58 L463 64 L466 60 L471 70', 's', 'rotate(4 380 98)', 'herb 0.4'],
      [ring(465, 51, 2), 'G', 'rotate(4 380 98)'],
      [ring(432, 70, 16), 's', 'rotate(4 380 98)'],
      ['M396 62 c 6 -4 12 -4 18 0 s 12 4 18 0 M396 70 c 6 -4 12 -4 18 0 s 12 4 18 0 M396 78 c 6 -4 12 -4 18 0 s 12 4 18 0', 's', 'rotate(4 380 98)'],
      ['M392 104 H476 M392 122 H468 M392 140 H472', 's', 'rotate(4 380 98)'],
    ],
    washes: [
      ['M282 54 C 310 48 350 52 370 56 V126 C 340 130 300 128 282 124 Z', 'cool 0.2', 'rotate(4 380 98)'],
      [ring(250, 160, 2.2), 'warm 0.3'],
      [ring(504, 30, 1.8), 'cool 0.3'],
    ],
  },
  // an open guest book with a few signatures, a sigil stamp, and the quill
  // standing in its inkwell
  guestbook: {
    w: 420,
    h: 340,
    paths: [
      ['M200 92 C 160 78 92 76 30 88 V262 C 92 250 160 252 200 266', 'l', undefined, 'gold 0.08'],
      ['M200 92 C 240 78 308 76 370 88 V262 C 308 250 240 252 200 266', 'l', undefined, 'gold 0.08'],
      ['M200 92 V266', 's'],
      ['M30 262 L26 268 C 92 256 160 258 200 272 C 240 258 308 256 374 268 L370 262', 's'],
      [[128, 156, 184, 212, 240].map((y) => `M44 ${y} C 90 ${y - 8} 150 ${y - 6} 188 ${y + 4}`).join(' '), 'h'],
      [[128, 156, 184].map((y) => `M212 ${y + 4} C 250 ${y - 6} 310 ${y - 8} 356 ${y}`).join(' '), 'h'],
      ['M52 122 C 56 110 64 110 62 120 C 60 128 70 124 74 116 C 77 110 82 112 80 120 C 79 126 88 122 92 116 C 96 111 100 116 104 118 C 112 121 124 116 140 117', 's'],
      ['M60 150 C 64 140 70 140 70 148 C 70 156 62 156 64 148 C 66 142 78 142 84 146 C 90 150 96 140 100 144 C 104 148 108 150 116 146 C 124 142 130 146 136 148 L168 144', 's'],
      ['M50 206 C 58 196 66 200 62 208 C 58 214 70 214 78 204 C 82 199 86 204 88 208 C 92 212 100 204 106 204 L132 205', 's'],
      ['M218 126 C 224 116 232 118 228 126 C 224 132 236 132 242 122 C 246 116 250 122 252 126 C 256 130 264 122 270 122 L300 121', 's'],
      [ring(300, 222, 22), 's', undefined, 'warm 0.28'],
      [ring(300, 222, 16), 's'],
      ['M300 206 L313.9 230 L286.1 230 Z', 's'],
      [ring(300, 222, 2), 'G'],
      ['M203 268 L205 300 L201 295 L197 301 L197 268', 'g', undefined, 'herb 0.45'],
      ['M346 336 C 334 332 334 304 350 298 L356 294 V288 H384 V294 L390 298 C 406 304 406 332 394 336 Z', 'l', undefined, 'ink2 0.14'],
      ['M352 288 H388', 'l'],
      ['M338 316 C 356 320 384 320 402 316', 's'],
      ['M386 331 L396 321 M376 334 L398 312', 'h'],
      ...QUILL.map(([d, k]): Stroke => [d, k, 'translate(356 306) rotate(-72) scale(1 -1)', k === 'l' ? 'gold 0.25' : undefined]),
    ],
    washes: [
      ['M30 262 C 92 250 160 252 200 266 C 240 252 308 250 370 262 L374 268 C 308 256 240 258 200 272 C 160 258 92 256 26 268 Z', 'warm 0.4'],
      ['M338 316 C 356 320 384 320 402 316 C 402 326 398 334 394 336 H346 C 340 334 338 326 338 316 Z', 'cool 0.34'],
      [ring(60, 300, 2.2), 'cool 0.3'],
      [ring(392, 60, 1.8), 'herb 0.3'],
    ],
  },
}

const sketch = computed(() => SKETCHES[props.kind])
// the tinted outlines first, then the colour-only shapes over them
const washes = computed(() =>
  [
    ...sketch.value.paths.filter((p) => p[3]).map(([d, , t, w]): Wash => [d, w!, t]),
    ...(sketch.value.washes ?? []),
  ].map(([d, w, t]) => {
    const [c, o] = w.split(' ')
    return { d, t, c, o: Number(o) }
  }),
)
</script>

<style scoped>
.ps-draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ps-draw 1.4s cubic-bezier(0.45, 0, 0.25, 1) var(--d) forwards;
}
/* dark mode dims the washes, as the homepage dims its watercolour */
.dark .ps-wash {
  opacity: 0.7;
}
.ps-fade {
  opacity: 0;
  animation: ps-fade 0.8s ease var(--d) forwards;
}
@keyframes ps-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes ps-fade {
  to {
    opacity: 1;
  }
}
.ps-still .ps-draw {
  animation: none;
  stroke-dashoffset: 0;
}
.ps-still .ps-fade {
  animation: none;
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .ps-draw {
    animation: none;
    stroke-dashoffset: 0;
  }
  .ps-fade {
    animation: none;
    opacity: 1;
  }
}
</style>
