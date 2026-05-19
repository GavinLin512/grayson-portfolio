import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:    'var(--bg)',
        paper: 'var(--paper)',
        ink:   'var(--ink)',
        ink2:  'var(--ink2)',
        line:  'var(--line)',
        cool:  'var(--cool)',
        warm:  'var(--warm)',
      },
      fontFamily: {
        mincho: ['"Shippori Mincho"', 'serif'],
        mono:   ['"Space Mono"', 'monospace'],
        hand:   ['Caveat', 'cursive'],
      },
    },
  },
} satisfies Config
