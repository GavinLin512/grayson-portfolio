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
        gold:  'var(--gold)',
        herb:  'var(--herb)',
      },
      fontFamily: {
        mincho: ['"Shippori Mincho"', 'serif'],
        mono:   ['"Space Mono"', 'monospace'],
        hand:   ['Caveat', 'cursive'],
      },
      // Type scale (9 steps, floor 12px). Values live in tokens.css as the
      // single source of truth; keys are px for a direct mental model.
      //   12 caption/label/meta · 14 small body · 16 body · 20 lead/subhead
      //   28 minor heading · 40 section heading · 64 page title + hero base
      //   96 hero (md) · 144 hero (lg)
      fontSize: {
        '12':  'var(--text-12)',
        '14':  'var(--text-14)',
        '16':  'var(--text-16)',
        '20':  'var(--text-20)',
        '28':  'var(--text-28)',
        '40':  'var(--text-40)',
        '64':  'var(--text-64)',
        '96':  'var(--text-96)',
        '144': 'var(--text-144)',
      },
    },
  },
} satisfies Config
