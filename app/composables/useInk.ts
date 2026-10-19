// Shared ink state for InkPen and its palette chip: the active ink token, the
// eraser switch and a clear signal (a counter InkPen watches).
export const INK_COLORS = [
  { token: '--ink', name: 'ink' },
  { token: '--cool', name: 'indigo' },
  { token: '--warm', name: 'sienna' },
  { token: '--herb', name: 'herbal' },
  { token: '--gold', name: 'gold' },
]

export function useInk() {
  const token = useState<string>('ink-color', () => '--ink')
  // the eraser is a tool of its own; the ink token is kept so picking an ink swaps back
  const eraser = useState<boolean>('ink-eraser', () => false)
  const clearTick = useState<number>('ink-clear', () => 0)
  const clear = () => {
    clearTick.value++
  }
  return { token, eraser, clearTick, clear }
}
