<template>
  <div class="relative min-h-screen">
    <PhiLines
      :lines="[
        { x1: 0, y1: '38.2%', x2: '100%', y2: '38.2%', width: 1 },
        { x1: '5%', y1: '23.6%', x2: '38.2%', y2: '23.6%', width: 0.5, opacity: 0.55 },
        { x1: '61.8%', y1: '8%', x2: '61.8%', y2: '94%', width: 0.5 },
      ]"
      :dot="{ cx: '61.8%', cy: '38.2%', r: 5 }"
    />

    <!-- Left-side decorations (desktop only) -->
    <p class="hidden lg:block absolute left-[60px] top-[130px] font-mono text-[12px] leading-[1.55] opacity-85">
      — 01 / hello.<br />
      portfolio of grayson — a frontend<br />
      engineer based in taipei.
    </p>

    <span class="hidden lg:block absolute left-[60px] top-[320px] font-mono text-[11px] opacity-55 tracking-[0.02em]">
      N° 2026 — 04
    </span>

    <TickWall
      :count="5"
      :length="56"
      :gap="16"
      class="hidden lg:block absolute left-[60px] bottom-[120px]"
    />

    <!-- Bottom-right title block -->
    <div class="absolute right-[24px] lg:right-[60px] bottom-[90px] text-right">
      <div class="font-mono text-[12px] tracking-[0.04em] opacity-70">a portfolio —</div>
      <div class="font-mincho font-extrabold text-[64px] md:text-[96px] lg:text-[144px] leading-[0.95] mt-[10px]">
        Grayson's<br />Portfolio.
      </div>
      <div class="font-mono text-[11px] mt-[10px] opacity-70">design · code · craft / 2018 → 2026</div>
    </div>
  </div>
</template>
