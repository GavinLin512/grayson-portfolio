export const navItems = [
  { label: 'index',    path: '/' },
  { label: 'projects', path: '/projects' },
  { label: 'journal',  path: '/blog' },
  { label: 'about',    path: '/about' },
  { label: 'skills',   path: '/skills' },
  { label: 'journey',  path: '/journey' },
  { label: 'contact',  path: '/contact' },
]

// Only reachable from the footer on desktop, so the mobile menus carry it too.
export const guestbookItem = { label: 'guestbook', path: '/guestbook' }
export const allNavItems = [...navItems, guestbookItem]

export const padNum = (n: number) => String(n).padStart(2, '0')

export function useNavState() {
  const route = useRoute()
  const isActive = (path: string) => (path === '/' ? route.path === '/' : route.path.startsWith(path))
  const current = computed(() => allNavItems.find(i => isActive(i.path)))
  return { isActive, current }
}

// Open/close state for a mobile menu: closes on navigation, Esc and when the
// viewport grows into the desktop layout, and locks page scroll while open.
export function useDisclosure() {
  const route = useRoute()
  const open = ref(false)
  const close = () => { open.value = false }
  const toggle = () => { open.value = !open.value }

  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
  const onWide = (e: MediaQueryListEvent) => { if (e.matches) close() }
  let mq: MediaQueryList | null = null

  watch(open, (v) => {
    document.documentElement.style.overflow = v ? 'hidden' : ''
    if (v) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  })
  watch(() => route.path, close)

  onMounted(() => {
    mq = window.matchMedia('(min-width: 1024px)')
    mq.addEventListener('change', onWide)
  })
  onBeforeUnmount(() => {
    mq?.removeEventListener('change', onWide)
    window.removeEventListener('keydown', onKey)
    document.documentElement.style.overflow = ''
  })

  return { open, toggle, close }
}
