/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,ts,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ----------------------------------------------------------------------
      // Semantic design tokens. These map Tailwind utilities to the CSS
      // variables defined in app.css (:root). They are intentionally named by
      // ROLE (surface, accent, ink…), not by aesthetic, so a future rebrand is
      // a token-value change — never a class rename across components.
      //
      // The `<alpha-value>` placeholder lets the `/opacity` modifier work
      // (e.g. bg-accent/10, border-hairline/60).
      // ----------------------------------------------------------------------
      colors: {
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-raised': 'rgb(var(--surface-raised-rgb) / <alpha-value>)',
        hairline: 'rgb(var(--hairline-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft-rgb) / <alpha-value>)',
        success: 'rgb(var(--success-rgb) / <alpha-value>)',
        error: 'rgb(var(--error-rgb) / <alpha-value>)',
      },
      fontFamily: {
        // Role-based families (avoid overriding Tailwind's global `mono`, which
        // other tools use). Both resolve to CSS-variable font stacks.
        display: ['var(--font-display)'],
        technical: ['var(--font-technical)'],
      },
      boxShadow: {
        led: '0 0 0 1px rgb(var(--accent-rgb) / 0.45), 0 0 14px rgb(var(--accent-rgb) / 0.45)',
        'led-sm': '0 0 8px rgb(var(--accent-rgb) / 0.35)',
        'panel-raised':
          'inset 0 1px 0 rgb(255 255 255 / 0.05), 0 1px 2px rgb(0 0 0 / 0.6), 0 8px 24px rgb(0 0 0 / 0.45)',
      },
      keyframes: {
        'led-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        'rack-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'led-pulse': 'led-pulse 2.6s ease-in-out infinite',
        'rack-in': 'rack-in .5s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
};
