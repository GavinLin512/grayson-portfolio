<template>
  <div class="bg-bg text-ink h-screen overflow-hidden flex flex-col">
    <SiteHeader />
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
