<template>
  <div class="bg-bg text-ink h-dvh overflow-hidden flex flex-col isolate">
    <BgLayer />
    <SiteHeader />
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
