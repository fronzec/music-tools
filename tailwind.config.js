/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,ts,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ----------------------------------------------------------------------
      // Studio / pedalboard design tokens (additive — scoped by usage, not
      // applied globally). Change the skin by editing these values.
      // ----------------------------------------------------------------------
      colors: {
        studio: {
          panel: '#0b0b0d', // device chassis — near-black
          raised: '#161619', // a card sitting on the panel
          rule: '#2a2a31', // hairline borders / engraving
          ink: '#e9e7e2', // warm off-white label text
          dim: '#8d8a84', // secondary / muted text
          led: '#ff9e2c', // amber indicator
          'led-soft': '#ffc06b', // lit highlight
        },
      },
      fontFamily: {
        // Distinct families, applied only inside the studio scope.
        plex: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        'plex-mono': ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        led: '0 0 0 1px rgba(255,158,44,.45), 0 0 14px rgba(255,158,44,.45)',
        'led-sm': '0 0 8px rgba(255,158,44,.35)',
        'panel-raised':
          'inset 0 1px 0 rgba(255,255,255,.05), 0 1px 2px rgba(0,0,0,.6), 0 8px 24px rgba(0,0,0,.45)',
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
