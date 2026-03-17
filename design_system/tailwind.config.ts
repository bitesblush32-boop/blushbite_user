import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './apps/web/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ─── COLORS ────────────────────────────────────────────
      colors: {
        // Core backgrounds
        bb: {
          bg:     '#07090f',  // deepest bg — page root
          bg2:    '#0d1117',  // modal / sheet bg
          card:   '#111620',  // card surface
          card2:  '#161d2a',  // nested card / hover state
          border: '#1c2333',  // all borders
        },

        // Text
        text: {
          DEFAULT: '#eeeef0',
          muted:   '#6b7280',
        },

        // Accent — rose-pink (primary CTA, chips, highlights)
        accent: {
          DEFAULT: '#e8607a',
          hover:   '#c4485e',
          glow:    'rgba(232,96,122,0.18)',
          subtle:  'rgba(232,96,122,0.08)',
          border:  'rgba(232,96,122,0.25)',
        },

        // Gold — verified badges, premium chips
        gold: {
          DEFAULT: '#c9a96e',
          subtle:  'rgba(201,169,110,0.08)',
          border:  'rgba(201,169,110,0.35)',
        },
      },

      // ─── TYPOGRAPHY ────────────────────────────────────────
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '1.4' }],
        xs:    ['11px', { lineHeight: '1.5' }],
        sm:    ['12px', { lineHeight: '1.6' }],
        base:  ['13.5px', { lineHeight: '1.6' }],
        md:    ['14px', { lineHeight: '1.6' }],
        lg:    ['16px', { lineHeight: '1.5' }],
        xl:    ['18px', { lineHeight: '1.4' }],
        '2xl': ['20px', { lineHeight: '1.3' }],
        '3xl': ['22px', { lineHeight: '1.25' }],
        '4xl': ['28px', { lineHeight: '1.2' }],
        '5xl': ['32px', { lineHeight: '1.15' }],
        '6xl': ['34px', { lineHeight: '1.1' }],
      },

      // ─── BORDER RADIUS ─────────────────────────────────────
      borderRadius: {
        sm:   '8px',
        DEFAULT: '14px',
        lg:   '16px',
        xl:   '20px',
        '2xl': '24px',
        full: '9999px',
      },

      // ─── BOX SHADOW / GLOW ─────────────────────────────────
      boxShadow: {
        'card':       '0 16px 40px rgba(0,0,0,0.4)',
        'card-hover': '0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(232,96,122,0.2)',
        'accent-glow':'0 8px 24px rgba(232,96,122,0.3)',
        'modal':      '0 32px 80px rgba(0,0,0,0.6)',
        'hero-hover': '0 0 40px rgba(232,96,122,0.18)',
        'player-btn': '0 0 24px rgba(232,96,122,0.18)',
        'inner-glow': 'inset 0 0 40px rgba(232,96,122,0.06)',
      },

      // ─── SPACING ───────────────────────────────────────────
      spacing: {
        '4.5':  '18px',
        '13':   '52px',
        '15':   '60px',
        '18':   '72px',
        '22':   '88px',
        '26':   '104px',
      },

      // ─── BACKDROP BLUR ─────────────────────────────────────
      backdropBlur: {
        header: '20px',
        modal:  '8px',
        chip:   '6px',
      },

      // ─── KEYFRAME ANIMATIONS ───────────────────────────────
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideFromBottom: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%':      { transform: 'scaleY(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(232,96,122,0)' },
          '50%':      { boxShadow: '0 0 24px rgba(232,96,122,0.35)' },
        },
      },

      animation: {
        'fade-up':         'fadeUp 0.4s ease forwards',
        'fade-in':         'fadeIn 0.25s ease forwards',
        'slide-up':        'slideUp 0.3s ease forwards',
        'slide-from-bottom': 'slideFromBottom 0.3s ease forwards',
        'wave':            'wave 1.2s ease-in-out infinite',
        'pulse-glow':      'pulseGlow 2s ease-in-out infinite',
      },

      // ─── BACKGROUND GRADIENTS ──────────────────────────────
      backgroundImage: {
        // Companion card placeholder gradients (dark purple/navy tones)
        'comp-1': 'linear-gradient(135deg, #1a1228 0%, #2d1a2e 50%, #1a1a2e 100%)',
        'comp-2': 'linear-gradient(135deg, #0f1a28 0%, #1f2840 50%, #2a1020 100%)',
        'comp-3': 'linear-gradient(135deg, #201228 0%, #1a2030 60%, #2a1a18 100%)',
        'comp-4': 'linear-gradient(135deg, #0a1620 0%, #1a1535 50%, #201a10 100%)',
        'comp-5': 'linear-gradient(135deg, #1a1020 0%, #2a1530 50%, #101820 100%)',
        'comp-6': 'linear-gradient(135deg, #101820 0%, #201028 50%, #102020 100%)',
        // Story card gradients
        'story-1': 'linear-gradient(135deg, #1a0e20 0%, #2a1540 100%)',
        'story-2': 'linear-gradient(135deg, #0e1a18 0%, #101f30 100%)',
        'story-3': 'linear-gradient(135deg, #1a1010 0%, #2a1520 100%)',
        'story-4': 'linear-gradient(135deg, #0f1428 0%, #1a1040 100%)',
        // Audio card gradients
        'audio-1': 'linear-gradient(135deg, #16101e 0%, #2a1040 100%)',
        'audio-2': 'linear-gradient(135deg, #101622 0%, #201030 100%)',
        'audio-3': 'linear-gradient(135deg, #0e1820 0%, #1a1230 100%)',
        // Accent avatar gradient
        'avatar':  'linear-gradient(135deg, #e8607a, #9b5fe0)',
        // Noise overlay (baked in as data URI — see globals.css)
        'noise':   "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
