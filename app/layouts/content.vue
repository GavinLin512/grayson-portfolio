<template>
  <div class="bg-bg text-ink h-screen overflow-hidden flex flex-col">
    <SiteHeader />
    <main class="flex-1 overflow-y-auto px-6 lg:px-[60px] py-[60px]">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
