<template>
  <div class="relative h-full px-[60px] pt-[40px] pb-[60px] flex flex-col">
    <!-- Page label + rule -->
    <div class="shrink-0">
      <span class="font-mono text-[14px] opacity-60">— 06 / about</span>
      <div class="border-t border-line mt-[14px]" />
    </div>

    <!-- Main grid fills remaining height -->
    <div class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-20 mt-[40px] flex-1">
      <!-- Left Column: portrait pinned top, caveat pushed to bottom -->
      <div class="flex flex-col h-full">
        <HatchPortrait class="hidden lg:block" :size="320" />
        <HatchPortrait class="block lg:hidden" :size="240" />
        <div class="flex-1" />
        <p class="font-hand text-[20px] opacity-90">— grayson, somewhere in taipei.</p>
      </div>

      <!-- Right Column -->
      <div>
        <h1 class="font-mincho text-[42px] leading-[1.15] max-w-[680px]">
          I make interfaces that try to stay out of the way.
        </h1>

        <!-- Measure bars decoration -->
        <div class="mt-[40px] space-y-[10px]">
          <div class="flex gap-[6px]">
            <div class="h-[14px] bg-ink opacity-[0.18] w-[40%]" />
            <div class="h-[14px] bg-ink opacity-[0.18] w-[30%]" />
            <div class="h-[14px] bg-ink opacity-[0.18] w-[20%]" />
          </div>
          <div class="flex gap-[6px]">
            <div class="h-[14px] bg-ink opacity-[0.18] w-[35%]" />
            <div class="h-[14px] bg-ink opacity-[0.18] w-[30%]" />
          </div>
        </div>

        <!-- 2×2 snapshot grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-[60px] gap-y-[32px] mt-[48px]">
          <div>
            <div class="font-mono text-[11px] opacity-60 mb-[6px] lowercase">now</div>
            <p class="font-mono text-[12px] leading-[1.55] opacity-85">
              lead frontend at hina · writing a small book on grids
            </p>
          </div>
          <div>
            <div class="font-mono text-[11px] opacity-60 mb-[6px] lowercase">previously</div>
            <p class="font-mono text-[12px] leading-[1.55] opacity-85">
              field llc · hatch · mori · taught a tiny class on css
            </p>
          </div>
          <div>
            <div class="font-mono text-[11px] opacity-60 mb-[6px] lowercase">elsewhere</div>
            <p class="font-mono text-[12px] leading-[1.55] opacity-85">
              github · @grayson<br />
              read.cv · /grayson<br />
              email · hi@grayson.cc<br />
              cv · <a href="/resume.pdf" download class="underline">/resume.pdf</a>
            </p>
          </div>
          <div>
            <div class="font-mono text-[11px] opacity-60 mb-[6px] lowercase">away from screens</div>
            <p class="font-mono text-[12px] leading-[1.55] opacity-85">
              brewing tea, walking long routes, collecting small ceramic things
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
