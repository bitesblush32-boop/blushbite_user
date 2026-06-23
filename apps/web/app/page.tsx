'use client'

// Public landing page — /
// No auth required. Authenticated users → /home via middleware.
// force-static ensures this is pre-rendered at build time and served from CDN.
export const dynamic = 'force-static'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { companions, stories, audios } from '@/lib/data'

const EASE = [0.22, 1, 0.36, 1] as const

// ─── Companion portrait SVGs ───────────────────────────────────────────────
// 5 distinct silhouettes — each companion gets a different hair style.
// viewBox 0 0 100 200. All fills are rgba-white so they read over any gradient.

const HAIR_PATHS = [
  // 0 — Ava: long flowing past shoulders
  'M50,6 C36,6 20,16 16,30 C12,44 14,62 16,80 C18,96 22,110 26,118 C29,104 33,86 38,78 C43,72 50,70 50,70 C50,70 57,72 62,78 C67,86 71,104 74,118 C78,110 82,96 84,80 C86,62 88,44 84,30 C80,16 64,6 50,6 Z',
  // 1 — Nora: chin-length bob
  'M50,12 C38,12 24,20 20,32 C16,44 18,57 22,67 C26,74 34,78 42,78 C42,73 44,70 47,68 Q50,70 53,68 C56,70 58,73 58,78 C66,78 74,74 78,67 C82,57 84,44 80,32 C76,20 62,12 50,12 Z',
  // 2 — Seren: curly, voluminous, wide
  'M50,4 C26,4 4,18 2,40 C0,52 4,64 8,74 C12,80 18,84 24,84 C26,78 30,73 34,70 Q42,68 50,68 Q58,68 66,70 C70,73 74,78 76,84 C82,84 88,80 92,74 C96,64 100,52 98,40 C96,18 74,4 50,4 Z',
  // 3 — Kai: androgynous short crop
  'M50,18 C40,18 28,24 24,34 C20,44 22,55 26,63 C30,68 36,70 42,70 C42,66 44,64 47,64 Q50,66 53,64 C56,64 58,66 58,70 C64,70 70,68 74,63 C78,55 80,44 76,34 C72,24 60,18 50,18 Z',
  // 4 — Maëve: updo — tight sides + bun on top
  'M50,24 C38,24 26,30 22,42 C18,52 20,62 24,70 C28,76 34,78 42,78 C42,73 44,70 47,68 Q50,70 53,68 C56,70 58,73 58,78 C66,78 72,76 76,70 C80,62 82,52 78,42 C74,30 62,24 50,24 Z',
]

function CompanionPortraitSVG({ index, uid }: { index: number; uid: string }) {
  const gid = `grd-${uid}`
  const style = index % HAIR_PATHS.length

  return (
    <svg
      viewBox="0 0 100 200"
      style={{ width: '100%', height: '100%', display: 'block' }}
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <radialGradient id={gid} cx="50%" cy="28%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.32)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Hair */}
      <path d={HAIR_PATHS[style]} fill="rgba(255,255,255,0.22)" />
      {/* Bun for Maëve */}
      {style === 4 && (
        <ellipse cx="50" cy="15" rx="10" ry="9" fill="rgba(255,255,255,0.25)" />
      )}

      {/* Face */}
      <ellipse cx="50" cy="52" rx="15" ry="17" fill="rgba(255,255,255,0.28)" />
      {/* Face highlight — radial glow */}
      <ellipse cx="50" cy="52" rx="15" ry="17" fill={`url(#${gid})`} />

      {/* Neck */}
      <path d="M43,68 L43,78 Q50,82 57,78 L57,68 Z" fill="rgba(255,255,255,0.22)" />

      {/* Shoulders / body */}
      <path
        d="M4,78 Q16,70 43,74 L43,200 L57,200 L57,74 Q84,70 96,78 L100,200 L0,200 Z"
        fill="rgba(255,255,255,0.13)"
      />
    </svg>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090f] relative overflow-x-hidden">
      {/* Noise texture — §10 */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 55% at 50% 0%, rgba(232,96,122,0.09) 0%, transparent 65%)',
        }}
      />

      <LandingNav />
      <HeroSection />
      <GlimpseSection />
      <TrustSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  )
}

// ─── NAV — 3-col grid, logo truly centered, CTA never overlaps ───────────────

function LandingNav() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="fixed top-0 left-0 right-0 z-[900]"
      style={{
        height: 64,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 20,
        background: 'rgba(7,9,15,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1c2333',
        willChange: 'transform',
      }}
    >
      {/* Left */}
      <div style={{ justifySelf: 'start' }}>
        <span
          className="hidden sm:inline text-[10px] tracking-[0.1em] uppercase"
          style={{
            color: '#6b7280',
            border: '1px solid #1c2333',
            padding: '4px 10px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          18+ Platform
        </span>
      </div>

      {/* Center */}
      <Link href="/" aria-label="BlushBite" style={{ display: 'block' }}>
        <Image
          src="/bb_croped.png"
          alt="BlushBite"
          width={110}
          height={34}
          priority
          style={{ objectFit: 'contain', display: 'block' }}
        />
      </Link>

      {/* Right */}
      <div style={{ justifySelf: 'end' }}>
        <Link href="/auth/signin">
          <motion.button
            whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(232,96,122,0.38)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: '#e8607a',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              fontWeight: 500,
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(232,96,122,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
              padding: '0 14px',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="sm:hidden" style={{ fontSize: 13 }}>Enter →</span>
            <span className="hidden sm:inline" style={{ fontSize: 13 }}>Enter privately →</span>
          </motion.button>
        </Link>
      </div>
    </motion.nav>
  )
}

// ─── BOKEH PARTICLES — float via transform only (GPU) ────────────────────────

function BokehParticles() {
  const particles = [
    { left: '12%', top: '20%', size: 90, delay: 0,   dur: 5.5 },
    { left: '78%', top: '12%', size: 60, delay: 1.2, dur: 6.2 },
    { left: '88%', top: '58%', size: 110,delay: 0.7, dur: 7.1 },
    { left: '6%',  top: '68%', size: 75, delay: 2.1, dur: 5.8 },
    { left: '52%', top: '82%', size: 55, delay: 1.6, dur: 6.5 },
    { left: '38%', top: '8%',  size: 45, delay: 3.0, dur: 4.8 },
  ]
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -18, 0], opacity: [0.07, 0.14, 0.07] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,96,122,0.55) 0%, transparent 70%)',
            filter: 'blur(22px)',
          }}
        />
      ))}
    </div>
  )
}

// ─── APP PREVIEW MOCKUP ───────────────────────────────────────────────────────
// Shown on the right column of the hero (desktop only).
// Gives visitors a direct preview of what's inside before signing in.

function AppPreviewMockup() {
  const comp  = companions[0]
  const story = stories[0]
  const audio = audios[0]

  return (
    // Outer glow aura
    <div className="relative w-full max-w-[320px] mx-auto" style={{ filter: 'drop-shadow(0 0 48px rgba(232,96,122,0.18))' }}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
      >
        {/* Floating animation wrapper */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            borderRadius: 22,
            border: '1px solid rgba(28,35,51,0.9)',
            background: '#0d1117',
            overflow: 'hidden',
            boxShadow: '0 32px 72px rgba(0,0,0,0.7)',
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              height: 2,
              background: 'linear-gradient(90deg, transparent, #e8607a 35%, #c9a96e 65%, transparent)',
            }}
          />

          {/* Mock nav bar */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid #1c2333' }}
          >
            <div className="flex gap-[6px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: ['#e8607a', '#c9a96e', '#1c2333'][i],
                    opacity: [0.8, 0.6, 1][i],
                  }}
                />
              ))}
            </div>
            <Image
              src="/bb_croped.png"
              alt="BlushBite"
              width={68}
              height={20}
              style={{ objectFit: 'contain', display: 'block', opacity: 0.8 }}
            />
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
              }}
            />
          </div>

          {/* Featured companion */}
          <div
            className="relative overflow-hidden"
            style={{ height: 230, background: comp.gradient }}
          >
            {/* AI portrait image */}
            <Image
              src="/hero-portrait.jpg"
              alt="Companion"
              fill
              priority
              sizes="320px"
              style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
            />

            {/* Bottom gradient fade */}
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: 100,
                background: 'linear-gradient(to top, #0d1117 0%, rgba(13,17,23,0.6) 60%, transparent 100%)',
              }}
            />

            {/* Verified chip */}
            <div
              className="absolute top-3 left-3 text-[10px] flex items-center gap-[5px] px-2 py-[4px] rounded-full"
              style={{
                background: 'rgba(201,169,110,0.15)',
                border: '1px solid rgba(201,169,110,0.35)',
                color: '#c9a96e',
                backdropFilter: 'blur(6px)',
              }}
            >
              ✦ Verified
            </div>

            {/* Pulse dot — live indicator */}
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="absolute top-3 right-3 flex items-center gap-1"
              style={{
                background: 'rgba(7,9,15,0.75)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '3px 8px',
                borderRadius: 20,
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 9, color: '#6b7280' }}>available</span>
            </motion.div>

            {/* Info */}
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <div>
                <div
                  className="text-[18px] text-[#eeeef0] leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {comp.name}
                  <span className="text-[13px] text-[#6b7280] ml-1 font-normal"
                    style={{ fontFamily: 'inherit' }}>
                    {comp.age}
                  </span>
                </div>
                <div className="text-[11px] mt-[2px]" style={{ color: '#6b7280' }}>
                  {comp.city}
                </div>
              </div>
              <div
                className="text-[11px] px-3 py-[6px] rounded-full text-white font-medium flex-shrink-0"
                style={{ background: '#e8607a', cursor: 'default' }}
              >
                Enter →
              </div>
            </div>
          </div>

          {/* Tags row */}
          <div
            className="flex gap-[6px] px-4 py-3 overflow-x-hidden"
            style={{ borderBottom: '1px solid #1c2333' }}
          >
            {comp.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] px-[9px] py-[3px] rounded-full flex-shrink-0"
                style={{
                  border: '1px solid #1c2333',
                  color: '#6b7280',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Story teaser */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid #1c2333' }}
          >
            <div
              className="text-[9px] uppercase tracking-[0.12em] mb-[6px] font-medium"
              style={{ color: '#e8607a' }}
            >
              Tonight's story
            </div>
            <div
              className="text-[13px] text-[#eeeef0] mb-1 leading-snug"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {story.title}
            </div>
            <div className="text-[11px]" style={{ color: '#6b7280' }}>
              {story.vibe} · {story.duration}
            </div>
          </div>

          {/* Audio player strip */}
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#e8607a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 14px rgba(232,96,122,0.45)',
              }}
            >
              <span style={{ fontSize: 10, color: '#fff', marginLeft: 2 }}>▶</span>
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-[#eeeef0] mb-[5px] truncate">{audio.title}</div>
              {/* Animated waveform bars — CSS keyframes, compositor thread */}
              <div className="flex items-center gap-[2px]" style={{ height: 16 }}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 2,
                      borderRadius: 1,
                      background: i < 17 ? '#e8607a' : 'rgba(232,96,122,0.25)',
                      height: `${5 + (i % 5) * 3}px`,
                      animation: `wave 1.2s ease-in-out ${(i * 0.055).toFixed(2)}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>

            <span style={{ fontSize: 10, color: '#6b7280', flexShrink: 0 }}>
              {audio.duration}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
// Desktop: text left 50% + app mockup right 50%
// Mobile:  stacked — headline → CTAs → companion portrait scroll row

function HeroSection() {
  return (
    <section
      className="relative z-10"
      style={{ minHeight: '100vh', paddingTop: 64 }}
    >
      <BokehParticles />

      {/* Desktop: two-column grid */}
      <div
        className="hidden md:grid max-w-[1200px] mx-auto px-10"
        style={{
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
          alignItems: 'center',
          minHeight: 'calc(100vh - 64px)',
          paddingTop: 40,
          paddingBottom: 40,
        }}
      >
        {/* Left — text + CTAs */}
        <HeroTextBlock />

        {/* Right — app preview */}
        <div className="flex justify-center items-center">
          <AppPreviewMockup />
        </div>
      </div>

      {/* Mobile: stacked */}
      <div
        className="md:hidden flex flex-col items-center text-center px-5"
        style={{ paddingTop: 48, paddingBottom: 72 }}
      >
        <HeroTextBlock mobile />

        {/* Companion scroll row on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
          className="w-full mt-8 mb-8"
        >
          <div
            className="flex gap-3"
            style={{
              overflowX: 'auto',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              paddingLeft: 20,
              paddingRight: 20,
              paddingBottom: 4,
            } as React.CSSProperties}
          >
            {companions.slice(0, 5).map((c, i) => (
              <HeroCompanionSilhouette key={c.id} companion={c} portraitIndex={i} staggerDelay={i * 0.07} />
            ))}
          </div>
        </motion.div>

        {/* Trust chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {TRUST_ITEMS.map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-[6px] text-[11.5px]" style={{ color: '#6b7280' }}>
              <span style={{ color: '#c9a96e' }}>{icon}</span>
              {text}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

const TRUST_ITEMS = [
  { icon: '🔒', text: 'Anonymous alias only' },
  { icon: '✦', text: 'Every companion verified' },
  { icon: '🌙', text: 'Discreet & shame-free' },
]

function HeroTextBlock({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={mobile ? 'w-full' : ''}>
      {/* Pill badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
        className={`inline-flex items-center gap-[6px] text-[11px] font-medium text-[#e8607a] px-[12px] py-[5px] rounded-full mb-6 ${mobile ? '' : ''}`}
        style={{
          background: 'rgba(232,96,122,0.1)',
          border: '1px solid rgba(232,96,122,0.25)',
          letterSpacing: '0.05em',
        }}
      >
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="w-[5px] h-[5px] rounded-full bg-current inline-block"
        />
        Strictly private · Verified companions · 18+
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
        className={`text-[#eeeef0] leading-[1.08] mb-5 ${mobile ? 'text-[34px]' : 'text-[52px] lg:text-[62px]'}`}
        style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.01em' }}
      >
        Your private world{' '}
        <em style={{ fontStyle: 'italic', color: '#e8607a' }}>awaits</em>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.25 }}
        className={`leading-[1.85] mb-8 ${mobile ? 'text-[14px] max-w-[360px] mx-auto' : 'text-[15px] max-w-[400px]'}`}
        style={{ color: '#6b7280' }}
      >
        Verified companions. Intimate stories. Voiced audio experiences.
        Curated entirely for you — and no one else.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.35 }}
        className={`flex items-center gap-3 mb-8 ${mobile ? 'flex-col' : 'flex-row'}`}
      >
        <Link href="/auth/signin">
          <motion.button
            whileHover={{ y: -2, boxShadow: '0 16px 36px rgba(232,96,122,0.42)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: '#e8607a',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              fontWeight: 500,
              borderRadius: 12,
              padding: '14px 30px',
              fontSize: 14,
              minHeight: 52,
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            Enter my world →
          </motion.button>
        </Link>
        <Link href="/auth/signin">
          <motion.button
            whileHover={{ borderColor: 'rgba(255,255,255,0.22)', color: '#eeeef0' }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: 'transparent',
              border: '1px solid #1c2333',
              color: '#6b7280',
              cursor: 'pointer',
              borderRadius: 12,
              padding: '13px 24px',
              fontSize: 13,
              minHeight: 52,
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            Create a private account
          </motion.button>
        </Link>
      </motion.div>

      {/* Trust chips — desktop only (mobile shows below companion row) */}
      {!mobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-wrap items-center gap-5"
        >
          {TRUST_ITEMS.map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-[6px] text-[11.5px]" style={{ color: '#6b7280' }}>
              <span style={{ color: '#c9a96e' }}>{icon}</span>
              {text}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ─── HERO COMPANION SILHOUETTE (mobile row) ───────────────────────────────────

function HeroCompanionSilhouette({
  companion,
  portraitIndex,
  staggerDelay,
}: {
  companion: (typeof companions)[0]
  portraitIndex: number
  staggerDelay: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.6 + staggerDelay }}
      whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(232,96,122,0.2)' }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative cursor-pointer flex-shrink-0"
      style={{
        width: 92,
        height: 142,
        borderRadius: 14,
        overflow: 'hidden',
        background: companion.gradient,
        border: hovered ? '1px solid rgba(232,96,122,0.45)' : '1px solid rgba(28,35,51,0.7)',
        scrollSnapAlign: 'start',
      }}
    >
      {/* Portrait SVG — visible beneath frost */}
      <div className="absolute inset-0">
        <CompanionPortraitSVG index={portraitIndex} uid={`hero-${portraitIndex}`} />
      </div>

      {/* Frost overlay — lifts on hover */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(7,9,15,0.28)',
          opacity: hovered ? 0 : 1,
          transition: 'opacity 0.45s ease',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: hovered ? 'blur(2px)' : 'blur(14px)',
          WebkitBackdropFilter: hovered ? 'blur(2px)' : 'blur(14px)',
          transition: 'backdrop-filter 0.5s ease, -webkit-backdrop-filter 0.5s ease',
        }}
      />

      {/* Lock — fades out */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: hovered ? 0 : 0.5, transition: 'opacity 0.4s ease' }}
      >
        <span style={{ fontSize: 13, filter: 'grayscale(1)' }}>🔒</span>
      </div>

      {/* Name reveal */}
      <div
        className="absolute bottom-0 left-0 right-0 p-[8px]"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.36s ease, transform 0.36s ease',
        }}
      >
        <div className="text-[11px] font-medium text-[#eeeef0]">{companion.name}</div>
        <div className="text-[9px]" style={{ color: '#6b7280' }}>{companion.city}</div>
      </div>
    </motion.div>
  )
}

// ─── GLIMPSE SECTION ─────────────────────────────────────────────────────────

function GlimpseSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-90px' })

  return (
    <section
      ref={ref}
      className="relative px-5 md:px-10 py-20 md:py-28 z-10"
      style={{
        background: 'linear-gradient(to bottom, transparent, #0d1117 20%, #0d1117 80%, transparent)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: EASE }}
        className="text-center mb-12"
      >
        <div className="text-[10px] uppercase tracking-[0.18em] mb-3 font-medium" style={{ color: '#e8607a' }}>
          a taste of what awaits
        </div>
        <h2
          className="text-[26px] md:text-[40px] text-[#eeeef0] mb-4 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Tonight&apos;s desire
        </h2>
        <p className="text-[13px] md:text-[14px] leading-[1.8] max-w-[380px] mx-auto" style={{ color: '#6b7280' }}>
          Companions who remember. Stories that stay with you. Audio that feels close.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[940px] mx-auto">
        <GlimpseCompanionCard inView={inView} delay={0} />
        <GlimpseStoryCard inView={inView} delay={0.09} />
        <GlimpseAudioCard inView={inView} delay={0.18} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-center mt-10"
      >
        <Link href="/auth/signin">
          <motion.button
            whileHover={{ y: -1, background: 'rgba(232,96,122,0.08)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              color: '#e8607a',
              border: '1px solid rgba(232,96,122,0.3)',
              background: 'transparent',
              cursor: 'pointer',
              padding: '10px 22px',
              borderRadius: 30,
              fontSize: 13,
              minHeight: 44,
            }}
          >
            Sign in to see everything →
          </motion.button>
        </Link>
      </motion.div>
    </section>
  )
}

// ─── GLIMPSE COMPANION CARD ───────────────────────────────────────────────────
// Portrait is partially visible — frost only at edges.

function GlimpseCompanionCard({ inView, delay }: { inView: boolean; delay: number }) {
  const [hovered, setHovered] = useState(false)
  const comp = companions[2] // Seren

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: EASE, delay }}
      whileHover={{ y: -5, boxShadow: '0 24px 56px rgba(0,0,0,0.55)' }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="rounded-[16px] overflow-hidden cursor-pointer"
      style={{
        background: '#111620',
        border: hovered ? '1px solid rgba(232,96,122,0.28)' : '1px solid #1c2333',
      }}
    >
      {/* Media — portrait VISIBLE, only bottom-fade + slight blur at top */}
      <div className="relative overflow-hidden" style={{ height: 220, background: comp.gradient }}>
        {/* AI portrait image */}
        <Image
          src="/hero-portrait.jpg"
          alt="Companion"
          fill
          sizes="(max-width: 768px) 50vw, 260px"
          style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
        />

        {/* Soft edge darkening — NOT a blur, just gradient fades */}
        <div
          className="absolute inset-x-0 top-0"
          style={{ height: 60, background: 'linear-gradient(to bottom, rgba(7,9,15,0.5), transparent)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: 90, background: 'linear-gradient(to top, #111620, transparent)' }}
        />

        {/* Partial blur overlay — reduced on hover to reveal more */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: hovered ? 'blur(0px)' : 'blur(6px)',
            WebkitBackdropFilter: hovered ? 'blur(0px)' : 'blur(6px)',
            opacity: hovered ? 0 : 1,
            transition: 'backdrop-filter 0.5s ease, opacity 0.4s ease, -webkit-backdrop-filter 0.5s ease',
          }}
        />

        {/* Verified chip */}
        <div
          className="absolute top-3 left-3 text-[10px] flex items-center gap-[5px] px-2 py-1 rounded-full"
          style={{
            background: 'rgba(7,9,15,0.75)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(201,169,110,0.35)',
            color: '#c9a96e',
          }}
        >
          ✦ Verified
        </div>

        {/* "Sign in" prompt — fades out on hover */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ opacity: hovered ? 0 : 0.9, transition: 'opacity 0.4s ease' }}
        >
          <span style={{ fontSize: 20, opacity: 0.4 }}>🔒</span>
          <span className="text-[11px]" style={{ color: '#6b7280' }}>Sign in to see companions</span>
        </div>

        {/* Revealed info on hover */}
        <div
          className="absolute bottom-3 left-4 right-4"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          <div className="text-[17px] text-[#eeeef0]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {comp.name}
          </div>
          <div className="text-[11px] mt-[2px]" style={{ color: '#6b7280' }}>
            {comp.city} · from {comp.price}/evening
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="text-[14px] font-medium text-[#eeeef0] mb-1">{comp.name}</div>
        <div className="text-[11.5px] mb-3" style={{ color: '#6b7280' }}>
          {comp.city} &middot; {comp.vibe}
        </div>
        <div className="flex flex-wrap gap-[6px]">
          {comp.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="text-[11px] px-[9px] py-[3px] rounded-full"
              style={{ border: '1px solid #1c2333', color: '#6b7280', background: 'rgba(255,255,255,0.02)' }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── GLIMPSE STORY CARD ───────────────────────────────────────────────────────

function GlimpseStoryCard({ inView, delay }: { inView: boolean; delay: number }) {
  const [hovered, setHovered] = useState(false)
  const story = stories[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: EASE, delay }}
      whileHover={{ y: -5, boxShadow: '0 24px 56px rgba(0,0,0,0.55)' }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="rounded-[16px] overflow-hidden cursor-pointer"
      style={{
        background: '#111620',
        border: hovered ? '1px solid rgba(232,96,122,0.28)' : '1px solid #1c2333',
      }}
    >
      {/* Atmospheric media area */}
      <div className="relative overflow-hidden" style={{ height: 160, background: story.gradient }}>
        {/* Decorative type lines — suggest a page of text behind glass */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 gap-[6px]" style={{ opacity: 0.12 }}>
          {[90, 75, 88, 60, 82, 70, 50].map((w, i) => (
            <div
              key={i}
              style={{ height: 3, width: `${w}%`, borderRadius: 2, background: '#eeeef0' }}
            />
          ))}
        </div>

        {/* Frost */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: hovered ? 'blur(2px)' : 'blur(12px)',
            WebkitBackdropFilter: hovered ? 'blur(2px)' : 'blur(12px)',
            background: hovered ? 'rgba(7,9,15,0.1)' : 'rgba(7,9,15,0.44)',
            transition: 'backdrop-filter 0.5s ease, opacity 0.45s ease, -webkit-backdrop-filter 0.5s ease',
          }}
        />

        {/* Centered label */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ opacity: hovered ? 0 : 1, transition: 'opacity 0.4s ease' }}
        >
          <span
            className="text-[11px] font-medium tracking-[0.08em]"
            style={{
              color: '#eeeef0',
              background: 'rgba(7,9,15,0.7)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '4px 12px',
              borderRadius: 20,
            }}
          >
            {story.type} · {story.duration}
          </span>
          <span className="text-[10px]" style={{ color: '#6b7280' }}>Sign in to read</span>
        </div>

        {/* Hover: opening line */}
        <div
          className="absolute inset-0 flex items-center px-6"
          style={{
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <p
            className="text-[13px] leading-[1.75] italic"
            style={{ color: '#c4c8d0', fontFamily: "'Playfair Display', serif" }}
          >
            "It started with a look held just a moment too long. The kind that means something."
          </p>
        </div>

        {/* Bottom chips */}
        <div
          className="absolute bottom-3 left-3 flex gap-2"
          style={{ opacity: hovered ? 1 : 0.35, transition: 'opacity 0.4s ease' }}
        >
          {[story.type, story.duration].map((label) => (
            <span
              key={label}
              className="text-[10px] text-[#eeeef0] px-2 py-1 rounded-full"
              style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="text-[14px] font-medium text-[#eeeef0] mb-2 leading-[1.35]">{story.title}</div>
        <div className="text-[11.5px] mb-3" style={{ color: '#6b7280' }}>{story.vibe}</div>
        <div
          className="text-[11px] font-medium"
          style={{ color: '#e8607a', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
        >
          Read &amp; listen →
        </div>
      </div>
    </motion.div>
  )
}

// ─── GLIMPSE AUDIO CARD ───────────────────────────────────────────────────────

function GlimpseAudioCard({ inView, delay }: { inView: boolean; delay: number }) {
  const [hovered, setHovered] = useState(false)
  const audio = audios[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: EASE, delay }}
      whileHover={{ y: -5, boxShadow: '0 24px 56px rgba(0,0,0,0.55)' }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="rounded-[16px] overflow-hidden cursor-pointer"
      style={{
        background: '#111620',
        border: hovered ? '1px solid rgba(232,96,122,0.28)' : '1px solid #1c2333',
      }}
    >
      {/* Waveform area */}
      <div
        className="flex items-center justify-center relative overflow-hidden"
        style={{ height: 130, background: audio.gradient }}
      >
        {/* Dark base */}
        <div className="absolute inset-0" style={{ background: 'rgba(7,9,15,0.2)' }} />

        {/* Extra dark — opacity only (GPU) */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(7,9,15,0.3)', opacity: hovered ? 0 : 1, transition: 'opacity 0.5s ease' }}
        />

        {/* Blur */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: hovered ? 'blur(0px)' : 'blur(8px)',
            WebkitBackdropFilter: hovered ? 'blur(0px)' : 'blur(8px)',
            transition: 'backdrop-filter 0.5s ease, -webkit-backdrop-filter 0.5s ease',
          }}
        />

        {/* Full waveform bars — CSS @keyframes (compositor thread) */}
        <div className="relative flex items-center gap-[3px] h-[44px] px-5">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 3,
                borderRadius: 2,
                background: '#e8607a',
                height: `${12 + (i % 5) * 7}px`,
                opacity: hovered ? 0.75 : 0.2,
                animation: hovered ? `wave 1.2s ease-in-out ${(i * 0.07).toFixed(2)}s infinite` : 'none',
                transition: 'opacity 0.4s ease',
              }}
            />
          ))}
        </div>

        {/* Play button — appears on hover */}
        <motion.div
          animate={hovered ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute"
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: '#e8607a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(232,96,122,0.55)',
          }}
        >
          <span style={{ fontSize: 14, color: '#fff', marginLeft: 3 }}>▶</span>
        </motion.div>

        {/* Locked hint */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: hovered ? 0 : 1, transition: 'opacity 0.4s ease' }}
        >
          <span className="text-[11px]" style={{ color: '#6b7280' }}>Sign in to listen</span>
        </div>
      </div>

      <div className="p-4">
        <div className="text-[14px] font-medium text-[#eeeef0] mb-1">{audio.title}</div>
        <div className="text-[11.5px] mb-3" style={{ color: '#6b7280' }}>
          {audio.voice} &middot; {audio.duration} &middot; {audio.vibe}
        </div>
        <div
          className="text-[11px] font-medium"
          style={{ color: '#e8607a', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
        >
          Preview audio →
        </div>
      </div>
    </motion.div>
  )
}

// ─── TRUST SECTION ────────────────────────────────────────────────────────────

function TrustSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      ref={ref}
      className="relative px-5 md:px-10 py-20 md:py-28 z-10"
      style={{ background: 'linear-gradient(to bottom, transparent, #0d1117 30%, #0d1117 70%, transparent)' }}
    >
      <div className="max-w-[820px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <div className="text-[10px] uppercase tracking-[0.18em] mb-4 font-medium" style={{ color: '#c9a96e' }}>
            your privacy, above all
          </div>
          <h2
            className="text-[26px] md:text-[44px] text-[#eeeef0] mb-5 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your identity stays{' '}
            <em style={{ fontStyle: 'italic', color: '#e8607a' }}>private — always</em>
          </h2>
          <p
            className="text-[13px] md:text-[15px] leading-[1.85] mb-12 max-w-[500px] mx-auto"
            style={{ color: '#6b7280' }}
          >
            No real names. No exposed history. You choose an anonymous alias — and that
            is all anyone ever sees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: '🔒',
              title: 'Anonymous by design',
              body: 'A randomly generated alias (@adjective-noun). Your real name, email, and history are never visible to anyone.',
            },
            {
              icon: '✦',
              title: 'Verified companions',
              body: 'Every companion completes ID verification, legal documentation, and a liveness check before going live.',
            },
            {
              icon: '🌙',
              title: 'Discreet billing',
              body: "No \"BlushBite\" on your statement. Payments appear as a neutral merchant reference, always.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 22 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE, delay: 0.12 + i * 0.1 }}
              className="rounded-[14px] p-5 text-left"
              style={{ background: '#111620', border: '1px solid #1c2333' }}
            >
              <div className="text-[22px] mb-3">{item.icon}</div>
              <div className="text-[13.5px] font-medium text-[#eeeef0] mb-2">{item.title}</div>
              <p className="text-[12px] leading-[1.75]" style={{ color: '#6b7280' }}>
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FINAL CTA ────────────────────────────────────────────────────────────────

function FinalCTASection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      ref={ref}
      className="relative px-5 md:px-10 py-24 md:py-36 overflow-hidden z-10"
      style={{ background: '#07090f' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(232,96,122,0.11) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{ width: 180, height: 1, background: 'linear-gradient(90deg, transparent, #e8607a, transparent)' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.65, ease: EASE }}
        className="relative max-w-[560px] mx-auto text-center"
      >
        <div
          className="inline-flex items-center gap-[6px] text-[11px] font-medium text-[#e8607a] px-[12px] py-[5px] rounded-full mb-8"
          style={{ background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.25)', letterSpacing: '0.05em' }}
        >
          <span className="w-[5px] h-[5px] rounded-full bg-current inline-block" />
          You&apos;ve arrived at the door
        </div>

        <h2
          className="text-[36px] md:text-[58px] text-[#eeeef0] leading-[1.08] mb-6"
          style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.01em' }}
        >
          Begin{' '}
          <em style={{ fontStyle: 'italic', color: '#e8607a' }}>quietly</em>
        </h2>

        <p
          className="text-[14px] md:text-[15px] leading-[1.85] mb-10 max-w-[380px] mx-auto"
          style={{ color: '#6b7280' }}
        >
          Create your anonymous account in under a minute. No real name required.
          No one knows you&apos;re here.
        </p>

        <div className="flex flex-col items-center gap-4">
          <Link href="/auth/signin">
            <motion.button
              whileHover={{ y: -3, boxShadow: '0 20px 48px rgba(232,96,122,0.45)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: '#e8607a',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                fontWeight: 500,
                borderRadius: 14,
                padding: '16px 38px',
                fontSize: 15,
                minHeight: 56,
                boxShadow: '0 8px 28px rgba(232,96,122,0.28)',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Enter my world →
            </motion.button>
          </Link>
          <Link href="/auth/signin">
            <motion.button
              whileHover={{ color: '#eeeef0' }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                fontSize: 13,
                textDecoration: 'underline',
                textDecorationColor: 'rgba(107,114,128,0.35)',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Already have a private account? Sign in
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer
      className="relative px-5 md:px-10 py-10 z-10"
      style={{ borderTop: '1px solid #1c2333', background: '#07090f' }}
    >
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          {[
            { label: 'Privacy & Anonymity', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Safety & Consent', href: '/privacy' },
            { label: 'Are you a companion?', href: '/auth/signin' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[12px] transition-colors duration-150"
              style={{ color: '#6b7280' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#eeeef0')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#6b7280')}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 justify-center text-[12px]" style={{ color: '#6b7280' }}>
          <span>🔒 Anonymous IDs</span>
          <span>✦ All companions verified</span>
          <span>18+ &middot; EU hosted</span>
        </div>
      </div>
      <p className="text-center text-[11px] mt-6" style={{ color: '#6b7280', opacity: 0.4 }}>
        &copy; 2025 BlushBite &middot; Strictly 18+ &middot; Netherlands &middot; Designed for desire
      </p>
    </footer>
  )
}
