<template>
  <div class="bg-bg text-ink min-h-screen flex flex-col">
    <SiteHeader class="sticky top-0 z-10" />
    <main class="flex-1 p-6 lg:p-[60px]">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
