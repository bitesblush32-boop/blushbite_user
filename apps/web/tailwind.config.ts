import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bb: {
          bg: '#07090f',
          bg2: '#0d1117',
          card: '#111620',
          card2: '#161d2a',
          border: '#1c2333',
        },
        text: {
          DEFAULT: '#eeeef0',
          muted: '#6b7280',
        },
        accent: {
          DEFAULT: '#e8607a',
          hover: '#c4485e',
          glow: 'rgba(232,96,122,0.18)',
          subtle: 'rgba(232,96,122,0.08)',
          border: 'rgba(232,96,122,0.25)',
        },
        gold: {
          DEFAULT: '#c9a96e',
          subtle: 'rgba(201,169,110,0.08)',
          border: 'rgba(201,169,110,0.35)',
        },
        muted: '#6b7280',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '14px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 16px 40px rgba(0,0,0,0.4)',
        'card-hover': '0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(232,96,122,0.2)',
        'accent-glow': '0 8px 24px rgba(232,96,122,0.3)',
        modal: '0 32px 80px rgba(0,0,0,0.6)',
        'hero-hover': '0 0 40px rgba(232,96,122,0.18)',
        'input-focus': '0 0 0 3px rgba(232,96,122,0.1)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(232,96,122,0)' },
          '50%': { boxShadow: '0 0 24px rgba(232,96,122,0.35)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.25s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        wave: 'wave 1.2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
