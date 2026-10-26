<template>
  <!-- mobile background (site-wide, below lg): a fixed layer behind the page — a
       paper-to-gold wash, a breathing candle glow along the bottom and a little
       grain. The layout root needs `isolate` so the z-[-1] layer paints above
       its bg-bg. Header and footer bar are opaque and cover its top and bottom
       edges. -->
  <div class="lg:hidden fixed inset-0 z-[-1] pointer-events-none" aria-hidden="true">
    <div class="bl-wash absolute inset-0" />
    <div class="bl-candle absolute inset-0" />
    <div class="bl-grain absolute inset-0" />
  </div>
</template>

<style scoped>
.bl-wash {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--paper) 55%, transparent),
    transparent 42%,
    color-mix(in srgb, var(--gold) 6%, transparent)
  );
}
.bl-candle {
  background: radial-gradient(
    ellipse 95% 46% at 50% 100%,
    color-mix(in srgb, var(--warm) 15%, transparent),
    transparent 70%
  );
  animation: bl-breath 7s ease-in-out infinite;
}
.bl-grain {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.045;
}
@keyframes bl-breath {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bl-candle {
    animation: none;
    opacity: 0.8;
  }
}
</style>
