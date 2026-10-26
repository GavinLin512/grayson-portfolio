<template>
  <footer
    class="sticky bottom-0 z-10 lg:static lg:h-9 lg:flex lg:justify-between lg:items-center lg:px-7 border-t border-line text-14 lg:opacity-70 font-mono bg-bg"
  >
    <span class="hidden lg:inline">© 2026 — grayson · index 00</span>
    <span class="hidden lg:inline">— a portfolio in beige</span>
    <NuxtLink to="/guestbook" class="hidden lg:inline hover:opacity-100 transition-opacity">guestbook →</NuxtLink>

    <MobileNav part="footer" />
  </footer>
</template>
