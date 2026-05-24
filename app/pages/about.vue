<template>
  <div class="relative px-[60px] py-[80px]">
    <PhiLines
      :lines="[{ x1: 0, y1: '38.2%', x2: '100%', y2: '18%', width: 0.55, opacity: 0.55 }]"
    />

    <div class="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-20 mt-[30px]">
      <!-- Left Column -->
      <div>
        <GeoPortrait class="hidden lg:block" :width="400" :height="460" />
        <GeoPortrait class="block lg:hidden" :width="240" :height="280" />
        <p class="font-hand text-[20px] opacity-90 mt-3">— grayson, somewhere in taipei.</p>
      </div>

      <!-- Right Column -->
      <div>
        <h1 class="font-mincho text-[42px] leading-[1.15] max-w-[580px]">
          I make interfaces that try to stay out of the way.
        </h1>
        <div class="mt-[26px] space-y-4">
          <p class="font-mono text-[12px] leading-[1.55] opacity-85">
            I'm a frontend engineer who cares about the quiet parts — the spacing, the transitions, the
            moments where a UI disappears and the work takes over. I've been building interfaces
            professionally since 2018, mostly in Vue and TypeScript.
          </p>
          <p class="font-mono text-[12px] leading-[1.55] opacity-85">
            My background is in visual communication. Before I wrote code I drew things, and that
            instinct never left. I think in grids, ratios, and reading rhythm — which probably explains
            why φ shows up so often in my work.
          </p>
          <p class="font-mono text-[12px] leading-[1.55] opacity-85">
            I'm currently based in Taipei. I work best on small, focused teams where craft still
            matters — places where you can argue about letter-spacing without it being a joke.
          </p>
          <p class="font-mono text-[12px] leading-[1.55] opacity-85">
            This portfolio is built with Nuxt, deployed on Cloudflare Pages. The geometry is hand-coded.
            Nothing here is a template.
          </p>
        </div>

        <a
          href="/resume.pdf"
          download
          class="inline-block border border-ink px-4 py-2 font-mono text-[12px] mt-12"
        >
          Download CV ↓
        </a>
      </div>
    </div>
  </div>
</template>
