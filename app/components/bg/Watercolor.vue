<template>
  <!-- index background: a lakeside town in fountain pen and watercolour,
       after a plein-air sketch. Washes bleed through one displacement filter,
       pen lines wobble through another, and the town mirrors into the lake
       through a ripple. Like the title, it waits for `play` (the intro done):
       the washes fade in, then the pen draws it stroke by stroke. Colours are
       palette tokens, so dark mode repaints it. Anchored bottom-right inside
       the frame; on phones it sits along the bottom edge. Washes and pen are
       two layers, so drawing the pen never re-runs the wash filters. -->
  <div class="wc absolute inset-0 lg:inset-[24px] z-0 pointer-events-none" :class="{ 'wc-play': play }" aria-hidden="true" data-pagefind-ignore>
    <svg class="wc-washes absolute inset-0 w-full h-full" viewBox="0 0 1200 660" preserveAspectRatio="xMaxYMax meet" fill="none">
      <defs>
        <!-- wet edges: low-frequency noise pushes every wash outline around -->
        <filter id="wc-bleed" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="3" seed="7" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="18" xChannelSelector="R" yChannelSelector="G" result="wet" />
          <feGaussianBlur in="wet" stdDeviation="0.7" result="soft" />
          <!-- uneven pigment: the same noise's blue channel (unused by the
               warp) settles the colour thicker in some patches, thinner in others -->
          <feColorMatrix in="warp" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1.8 0 -0.25" result="pool" />
          <feComposite in="soft" in2="pool" operator="in" result="pooled" />
          <!-- granulation: fine noise thins the wash in specks -->
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="2" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.6 0 0 0 0.62" result="tooth" />
          <feComposite in="pooled" in2="tooth" operator="in" />
        </filter>
        <!-- reflection: noise stretched along x shears the mirror sideways -->
        <filter id="wc-ripple" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="2" seed="9" result="swell" />
          <feDisplacementMap in="SourceGraphic" in2="swell" scale="12" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="2 0.6" />
        </filter>
        <linearGradient id="wc-lake" x1="60" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" style="stop-color: var(--cool)" stop-opacity="0" />
          <stop offset="0.35" style="stop-color: var(--cool)" stop-opacity="0.16" />
          <stop offset="1" style="stop-color: var(--cool)" stop-opacity="0.26" />
        </linearGradient>
        <linearGradient id="wc-depth" x1="0" y1="548" x2="0" y2="660" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#fff" stop-opacity="0.9" />
          <stop offset="1" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <mask id="wc-below" maskUnits="userSpaceOnUse" x="0" y="548" width="1200" height="112">
          <rect x="0" y="548" width="1200" height="112" fill="url(#wc-depth)" />
        </mask>
        <!-- the town's washes, drawn once and mirrored into the lake -->
        <g id="wc-town">
          <path
            v-for="(w, i) in TOWN"
            :key="i"
            :d="w[2]"
            :fill="`var(--${w[0]})`"
            :fill-opacity="w[1]"
            :stroke="`var(--${w[0]})`"
            :stroke-opacity="w[1] * 1.3"
            stroke-width="1.5"
          />
        </g>
      </defs>

      <!-- washes, back to front: sky and hills, the lake and its mirror,
           the town, the boat. Each shape is stroked in its own colour so the
           pigment pools along the rim as a drying wash does. -->
      <g filter="url(#wc-bleed)">
        <path
          v-for="(w, i) in BACK"
          :key="i"
          :d="w[2]"
          :fill="`var(--${w[0]})`"
          :fill-opacity="w[1]"
          :stroke="`var(--${w[0]})`"
          :stroke-opacity="w[1] * 1.3"
          stroke-width="1.5"
        />
        <path d="M60 552 C 300 546 700 548 1200 546 L1200 640 C 1100 652 960 636 860 648 C 740 660 600 640 480 650 C 360 660 220 636 120 640 Z" fill="url(#wc-lake)" />
        <path :d="LAKE_STROKES" stroke="var(--cool)" stroke-width="5" stroke-linecap="round" stroke-opacity="0.16" />
        <g mask="url(#wc-below)">
          <g filter="url(#wc-ripple)" opacity="0.6">
            <use href="#wc-town" transform="matrix(1 0 0 -1 0 1096)" />
          </g>
        </g>
        <use href="#wc-town" />
        <path d="M612 612 L676 612 L668 622 L620 622 Z" fill="var(--gold)" fill-opacity="0.5" />
        <circle v-for="(s, i) in SPLASH" :key="i" :cx="s.x" :cy="s.y" :r="s.r" :fill="`var(--${s.c})`" :fill-opacity="s.o" />
      </g>

    </svg>

    <svg class="wc-pen absolute inset-0 w-full h-full" viewBox="0 0 1200 660" preserveAspectRatio="xMaxYMax meet" fill="none">
      <defs>
        <!-- a nib never runs quite straight -->
        <filter id="wc-pen" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="jitter" />
          <feDisplacementMap in="SourceGraphic" in2="jitter" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <!-- pen, in the order it is drawn; the window fills, the spatter and
           the signature soak in after their strokes -->
      <g filter="url(#wc-pen)" stroke="var(--ink)" stroke-linecap="round" stroke-linejoin="round">
        <g v-for="(p, i) in PEN" :key="i" :stroke-width="p.w" :stroke-opacity="p.o" :style="{ '--t': `${p.t}s` }">
          <path v-for="(s, j) in p.strokes" :key="j" :d="s.d" class="wc-ink" pathLength="1" :style="{ '--d': s.at }" />
        </g>
        <path :d="WINDOWS" class="wc-soak" style="--d: 2.8s" fill="var(--ink)" fill-opacity="0.42" stroke-width="0.6" stroke-opacity="0.6" />
        <circle v-for="(s, i) in SPATTER" :key="i" class="wc-soak" style="--d: 3.6s" :cx="s.x" :cy="s.y" :r="s.r" fill="var(--ink)" :fill-opacity="s.o" stroke="none" />
        <text x="1104" y="644" text-anchor="end" class="wc-soak font-hand" style="--d: 4s" font-size="18" fill="var(--ink)" fill-opacity="0.5" stroke="none">grayson 26.10.26</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
// the page's play flag: the drawing starts once the intro is done
defineProps<{ play: boolean }>()

// mulberry32: integer math only, so SSR and every browser scatter the same
// marks (no hydration mismatch)
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const f = (n: number) => n.toFixed(1)

// [palette token, fill opacity, outline]
type Wash = [string, number, string]

const BACK: Wash[] = [
  // warm light low in the sky, and cool sky over the town
  ['gold', 0.18, 'M560 150 C 575 105 650 88 720 96 C 790 104 850 92 872 124 C 892 152 840 178 770 176 C 700 174 640 196 596 184 C 566 176 552 166 560 150 Z'],
  ['cool', 0.18, 'M930 40 C 990 18 1100 22 1170 48 C 1196 60 1190 110 1150 128 C 1100 150 1040 120 990 118 C 950 116 912 92 916 66 C 918 52 922 44 930 40 Z'],
  // haze, then the far hills in two glazes
  ['cool', 0.07, 'M80 430 C 160 400 300 410 420 425 C 520 438 600 430 660 445 C 700 456 690 480 640 486 C 520 498 300 492 160 488 C 100 486 60 460 80 430 Z'],
  ['ink2', 0.11, 'M140 548 L140 528 C 190 500 230 486 262 470 C 284 460 300 468 318 476 C 350 458 384 440 420 448 C 452 455 470 476 500 482 C 540 470 580 474 620 488 C 660 500 700 506 744 512 L744 548 Z'],
  ['cool', 0.1, 'M200 548 C 260 520 300 506 340 500 C 380 494 420 488 460 494 C 520 502 600 512 660 520 C 700 526 730 530 744 534 L744 548 Z'],
  ['cool', 0.14, 'M1128 548 L1130 504 C 1150 490 1172 482 1200 478 L1200 548 Z'],
  // the tall tree behind the tower, its crown going to smoke
  ['herb', 0.26, 'M868 300 C 850 250 870 210 890 180 C 905 150 890 120 905 95 C 918 72 940 64 952 80 C 966 98 950 124 962 150 C 975 178 1000 196 994 236 C 990 268 960 290 930 300 Z'],
  ['ink2', 0.16, 'M900 120 C 906 88 930 62 954 70 C 974 78 966 110 954 132 C 944 150 914 152 904 138 Z'],
]

const TOWN: Wash[] = [
  // the rock it stands on
  ['ink2', 0.24, 'M740 548 L746 506 C 750 484 768 472 790 474 L850 480 C 872 476 900 486 922 494 L1000 502 C 1040 498 1090 500 1130 512 L1136 548 Z'],
  ['cool', 0.12, 'M800 548 C 830 520 880 510 930 516 C 980 522 1040 520 1090 528 L1100 548 Z'],
  // left house: lit face, shade under the slab roof
  ['gold', 0.2, 'M806 302 L828 300 L829 470 L806 472 Z'],
  ['ink2', 0.28, 'M750 298 L838 296 L838 306 L752 308 Z'],
  // tower: stone, the shaded side, the pyramid roof
  ['gold', 0.2, 'M842 254 L904 254 L906 490 L841 492 Z'],
  ['ink2', 0.16, 'M884 256 L904 256 L906 490 L886 490 Z'],
  ['warm', 0.22, 'M873 184 L912 256 L834 256 Z'],
  ['ink2', 0.18, 'M873 184 L912 256 L878 256 Z'],
  // middle block: warm stone under a tiled roof
  ['gold', 0.24, 'M906 320 L1012 318 L1013 494 L906 496 Z'],
  ['warm', 0.42, 'M900 300 L1012 294 L1018 318 L898 322 Z'],
  ['ink2', 0.2, 'M902 322 L1016 318 L1014 332 L904 336 Z'],
  // right house, its long eave in shadow
  ['gold', 0.14, 'M1026 246 L1118 216 L1120 480 L1024 484 Z'],
  ['ink2', 0.16, 'M1026 246 L1046 240 L1046 484 L1024 484 Z'],
  ['ink2', 0.3, 'M1014 242 L1132 204 L1130 214 L1016 252 Z'],
  // trees in front: the left clump, the sunlit bush, a sapling at the edge
  ['herb', 0.3, 'M688 452 C 676 420 690 392 716 384 C 730 362 760 356 778 372 C 798 372 808 394 802 414 C 818 430 814 458 798 470 C 806 494 792 520 770 526 C 760 544 730 550 712 538 C 688 534 674 510 682 492 C 670 478 674 460 688 452 Z'],
  ['herb', 0.22, 'M694 500 C 700 478 730 470 756 480 C 780 488 790 508 778 526 C 760 544 720 546 704 532 C 694 522 690 510 694 500 Z'],
  ['herb', 0.28, 'M940 470 C 950 440 980 420 1010 424 C 1030 404 1066 400 1086 418 C 1112 414 1138 432 1140 458 C 1160 474 1158 506 1136 520 C 1140 540 1120 556 1096 552 L960 552 C 936 548 926 526 936 510 C 922 496 926 478 940 470 Z'],
  ['gold', 0.32, 'M1000 440 C 1030 420 1070 418 1090 432 C 1110 446 1100 470 1076 474 C 1050 478 1020 474 1004 462 C 994 454 994 446 1000 440 Z'],
  ['herb', 0.24, 'M1122 470 C 1112 440 1120 404 1140 392 C 1160 384 1176 400 1172 428 C 1180 450 1170 474 1150 478 Z'],
]

// a scribbled run of pen loops from a to b, bowed sideways by `bow`: the
// shorthand a sketcher uses for foliage. Loop size, pace and the line's
// drift all wander, so it never reads as a coil.
const loops = (ax: number, ay: number, bx: number, by: number, n: number, r: number, bow: number, seed: number) => {
  const rand = rng(seed)
  const radii = Array.from({ length: n + 2 }, () => r * (0.45 + 1.1 * rand()))
  const p1 = rand() * 6.3
  const p2 = rand() * 6.3
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy)
  const steps = n * 9
  let a = rand() * 6.3
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const k = Math.min(t * n, n)
    const rr = radii[Math.floor(k)]! + (radii[Math.floor(k) + 1]! - radii[Math.floor(k)]!) * (k % 1)
    const b = Math.sin(Math.PI * t) * bow + (Math.sin(t * 7 + p1) * 0.6 + Math.sin(t * 13 + p2) * 0.4) * r * 1.4
    const x = ax + dx * t - (dy / len) * b + rr * Math.cos(a)
    const y = ay + dy * t + (dx / len) * b + rr * Math.sin(a) * (0.6 + 0.3 * Math.sin(t * 5 + p2))
    d += `${i ? ' L' : 'M'}${f(x)} ${f(y)}`
    a += 0.7 * (0.5 + rand())
  }
  return d
}

// short strokes scattered over a box: [x, y, w, h, count, length, angle in degrees, seed]
const strokes = (x: number, y: number, w: number, h: number, n: number, len: number, deg: number, seed: number) => {
  const rand = rng(seed)
  const rad = (deg * Math.PI) / 180
  let d = ''
  for (let i = 0; i < n; i++) {
    const px = x + rand() * w
    const py = y + rand() * h
    const l = len * (0.6 + 0.8 * rand())
    d += `M${f(px)} ${f(py)} l${f(Math.cos(rad) * l)} ${f(Math.sin(rad) * l)} `
  }
  return d
}

const HILLS_PEN = 'M150 527 C 190 500 230 486 262 470 C 284 460 300 468 318 476 M352 459 C 372 448 396 442 420 448 C 452 455 470 476 500 482 M560 472 C 600 476 650 496 716 508'

// outlines run past their corners, as a quick hand overshoots them
const TOWN_PEN = [
  'M762 288 L760 476 M828 290 L829 470 M746 290 L842 287 M748 298 L840 295 M747 289 L749 299 M841 287 L839 296',
  'M842 250 L841 488 M904 252 L906 484 M873 182 L833 257 M873 182 L913 257 M873 182 L879 257 M831 255 L915 254 M836 261 L910 260',
  'M895 300 L1016 293 M893 322 L1021 317 M900 299 L898 323 M1012 293 L1018 318 M1012 320 L1013 492',
  'M1010 243 L1135 203 M1013 251 L1133 212 M1014 242 L1016 252 M1026 248 L1024 484 M1118 216 L1120 480',
  'M744 548 C 748 522 752 498 768 482 M790 476 C 800 500 806 524 804 548 M860 482 C 870 506 868 530 874 548 M1000 504 C 1010 520 1012 536 1020 548 M1090 506 C 1100 520 1108 534 1110 548',
].join(' ')

const DETAIL_PEN = [
  // roof tiles across the band, hatching on the tower roof's shaded face
  Array.from({ length: 17 }, (_, i) => {
    const x = 906 + i * 6
    const t = (x - 900) / 112
    return `M${x} ${f(300 - t * 6 + 1)} L${x + 1.5} ${f(322 - t * 5 - 1)}`
  }).join(' '),
  [880, 885, 890, 895, 900, 905].map((x) => `M${x} ${f(184 + (x - 873) * 1.846 + 3)} L${x - 1} 252`).join(' '),
  // mullions, stonework, the rock face, two trunks
  'M939 352 V380 M973 352 V380',
  strokes(846, 270, 54, 200, 16, 7, 0, 3),
  strokes(910, 388, 96, 100, 18, 8, 0, 5),
  strokes(750, 486, 375, 58, 42, 12, 72, 8),
  'M736 548 L740 500 M1150 478 L1148 520',
].join(' ')

const WINDOWS = [
  ...[774, 806].flatMap((x) => [312, 340, 368, 396].map((y) => `M${x} ${y} h9 v13 h-9 Z`)),
  'M865 304 V293 A8 8 0 0 1 881 293 V304 Z M857 352 h6 v15 h-6 Z M885 404 h6 v15 h-6 Z M860 440 h7 v12 h-7 Z',
  'M928 380 V352 A11 11 0 0 1 950 352 V380 Z M962 380 V352 A11 11 0 0 1 984 352 V380 Z M944 476 V446 A14 14 0 0 1 972 446 V476 Z',
  'M1050 282 h8 v12 h-8 Z M1090 270 h8 v12 h-8 Z M1052 344 h8 v12 h-8 Z M1092 334 h8 v12 h-8 Z M1072 404 h8 v12 h-8 Z',
].join(' ')

const FOLIAGE = [
  loops(690, 450, 776, 372, 9, 4.5, -14, 11),
  loops(700, 520, 800, 430, 9, 4, -10, 12),
  loops(684, 496, 712, 540, 4, 3.5, 6, 13),
  loops(680, 482, 760, 532, 7, 3.5, 8, 14),
  loops(716, 392, 800, 410, 6, 3.5, -6, 15),
  strokes(690, 498, 100, 38, 14, 9, 62, 16),
  loops(902, 280, 918, 170, 7, 3.5, 8, 21),
  loops(944, 486, 1060, 426, 11, 5, -18, 31),
  loops(1050, 424, 1146, 470, 9, 5, -16, 32),
  loops(970, 540, 1130, 520, 12, 4.5, -10, 33),
  loops(1000, 470, 1100, 500, 8, 3.5, 6, 34),
  loops(940, 500, 990, 452, 5, 3.5, -4, 35),
  strokes(950, 505, 180, 38, 18, 9, 62, 36),
  loops(1130, 466, 1150, 396, 6, 4, -8, 41),
].join(' ')

// the lake: brushed bands of colour, pen ripples, and broken verticals
// where the house walls fall into the water
const LAKE_STROKES = strokes(380, 560, 820, 80, 16, 60, 0, 17)
const WATER_PEN = [
  strokes(520, 556, 680, 90, 30, 28, 0, 19),
  [762, 828, 842, 904, 1013, 1026, 1118].map((x, i) => {
    const rand = rng(50 + i)
    let d = ''
    for (let y = 556 + rand() * 6; y < 626; y += 8 + rand() * 10) d += `M${f(x + rand() * 4 - 2)} ${f(y)} v${f(3 + rand() * 6)} `
    return d
  }).join(''),
].join(' ')

// a rowing boat, its rower and the oar; a flight of birds over the hills
const BOAT_PEN = [
  'M606 611 L682 611 M610 611 L620 623 L668 623 L678 611',
  'M641 598 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M644 601 L642 611 M650 603 L628 628 M618 631 h46 M626 637 h28',
  ...[[604, 132, 4], [628, 118, 3], [654, 142, 4.5], [586, 162, 3], [700, 104, 3.5]].map(([x, y, s]) => `M${x} ${y} q${s} ${-s!} ${2 * s!} 0 q${s} ${-s!} ${2 * s!} 0`),
].join(' ')

// ink flicked off the nib around the smoky crown, and colour off the brush
const SPATTER = (() => {
  const rand = rng(61)
  return Array.from({ length: 16 }, () => ({ x: f(830 + rand() * 230), y: f(40 + rand() * 230), r: f(0.6 + rand() * 1.8), o: f(0.15 + rand() * 0.25) }))
})()
const SPLASH = (() => {
  const rand = rng(73)
  return Array.from({ length: 10 }, (_, i) => ({ x: f(860 + rand() * 200), y: f(60 + rand() * 260), r: f(1.5 + rand() * 4), c: i % 3 ? 'herb' : 'cool', o: f(0.2 + rand() * 0.25) }))
})()

// the pen layers: [path, width, opacity, start, span, stroke time], in
// seconds after play. Every subpath becomes its own stroke, because a dash
// restarts at each subpath: drawn as one path, a layer would pop in at once.
// A layer's strokes start evenly across its span: hills, the town, foliage
// and details over it, the water, the boat and the birds last.
const PEN = (
  [
    [HILLS_PEN, 0.6, 0.4, 0.4, 0.6, 1.4],
    [TOWN_PEN, 0.95, 0.75, 0.7, 1.6, 1],
    [DETAIL_PEN, 0.55, 0.55, 1.6, 1.6, 0.6],
    [FOLIAGE, 0.6, 0.5, 1.4, 1.8, 1.2],
    [WATER_PEN, 0.6, 0.4, 2.4, 1.4, 0.6],
    [BOAT_PEN, 0.8, 0.7, 3, 0.6, 0.8],
  ] as const
).map(([d, w, o, start, span, t]) => {
  const subs = d.split(/(?=M)/).map((s) => s.trim()).filter(Boolean)
  return { w, o, t, strokes: subs.map((s, i) => ({ d: s, at: `${(start + (span * i) / subs.length).toFixed(2)}s` })) }
})
</script>

<style scoped>
/* faint: the title and the astrolabe stay in front. Its own layer, so the
   animations above never repaint it; the washes are a layer of their own
   too, so their filters rasterise once and fade in on the compositor. */
.wc {
  opacity: 0.8;
  will-change: transform;
}
.dark .wc {
  opacity: 0.5;
}
.wc-pen {
  will-change: transform;
}

/* authored paused (SSR-safe, no flash), released with .wc-play */
.wc-washes {
  will-change: opacity;
  opacity: 0;
  animation: wc-soak 1.6s ease 0.1s forwards paused;
}
.wc-ink {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: wc-ink var(--t) cubic-bezier(0.45, 0, 0.25, 1) var(--d) forwards paused;
}
.wc-soak {
  opacity: 0;
  animation: wc-soak 0.9s ease var(--d) forwards paused;
}
.wc-play .wc-washes,
.wc-play .wc-ink,
.wc-play .wc-soak {
  animation-play-state: running;
}
@keyframes wc-ink {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes wc-soak {
  to {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .wc-washes,
  .wc-ink,
  .wc-soak {
    animation: none;
    opacity: 1;
    stroke-dashoffset: 0;
  }
}
</style>
