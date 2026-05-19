<template>
  <div class="p-8 space-y-12">
    <section>
      <p class="font-mono text-[10px] opacity-40 uppercase tracking-widest mb-4">Tick Wall</p>
      <TickWall :count="5" :length="56" :gap="16" />
    </section>

    <section>
      <p class="font-mono text-[10px] opacity-40 uppercase tracking-widest mb-4">Tag Chips</p>
      <div class="flex gap-2 flex-wrap">
        <TagChip>css</TagChip>
        <TagChip>typescript</TagChip>
        <TagChip :active="true">vue</TagChip>
        <TagChip>nuxt</TagChip>
        <TagChip>design systems</TagChip>
      </div>
    </section>

    <section>
      <p class="font-mono text-[10px] opacity-40 uppercase tracking-widest mb-4">Geo Portrait</p>
      <GeoPortrait />
    </section>

    <section>
      <p class="font-mono text-[10px] opacity-40 uppercase tracking-widest mb-4">
        Phi Lines — manifesto diagonal (0, h·φ⁻¹) → (w, h·φ⁻²)
      </p>
      <div class="relative h-[300px] w-full border border-line">
        <PhiLines
          :lines="[{ x1: 0, y1: '61.8%', x2: '100%', y2: '38.2%', width: 1 }]"
          :dot="{ cx: '50%', cy: '50%' }"
        />
      </div>
    </section>
  </div>
</template>
