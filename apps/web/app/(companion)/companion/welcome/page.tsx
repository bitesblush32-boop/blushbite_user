'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function CompanionWelcomePage() {
  const router = useRouter()

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-5 py-10"
      style={{ background: '#07090f' }}
    >
      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient rose glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px]"
        style={{
          background: '#111620',
          border: '1px solid #1c2333',
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        {/* Top rose accent line */}
        <div
          style={{
            height: 3,
            background: 'linear-gradient(90deg, transparent, #e8607a, transparent)',
          }}
        />

        <div className="flex flex-col items-center text-center px-8 pt-8 pb-10">
          {/* Logo */}
          <Image
            src="/logo_light.png"
            alt="BlushBite"
            width={100}
            height={32}
            priority
            style={{ objectFit: 'contain', marginBottom: 24 }}
          />

          {/* Gold chip */}
          <span
            className="inline-flex items-center text-[11px] font-medium px-[10px] py-1 rounded-full mb-5"
            style={{
              color: '#c9a96e',
              background: 'rgba(201,169,110,0.08)',
              border: '1px solid rgba(201,169,110,0.35)',
            }}
          >
            ✦ You're becoming The Dream
          </span>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 600,
              color: '#eeeef0',
              lineHeight: 1.25,
              marginBottom: 14,
            }}
          >
            Welcome to the other side.
          </h1>

          {/* Subtext */}
          <p
            className="max-w-[340px]"
            style={{
              fontSize: 13,
              color: '#6b7280',
              lineHeight: 1.75,
              marginBottom: 0,
            }}
          >
            You're about to build your presence on BlushBite. Takes about 10 minutes. Your profile goes live after our team reviews it — usually within 48 hours.
          </p>

          {/* Step pills */}
          <div className="flex items-center justify-between w-full mt-6 mb-8 gap-2">
            {/* Step 1 — active */}
            <span
              className="flex-1 text-center rounded-full px-3 py-2 text-[11px] font-medium"
              style={{
                color: '#e8607a',
                background: 'rgba(232,96,122,0.08)',
                border: '1px solid rgba(232,96,122,0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              Build your profile
            </span>

            <span style={{ color: '#1c2333', fontSize: 12, flexShrink: 0 }}>→</span>

            {/* Step 2 */}
            <span
              className="flex-1 text-center rounded-full px-3 py-2 text-[11px]"
              style={{
                color: '#6b7280',
                border: '1px solid #1c2333',
                whiteSpace: 'nowrap',
              }}
            >
              Sign agreements
            </span>

            <span style={{ color: '#1c2333', fontSize: 12, flexShrink: 0 }}>→</span>

            {/* Step 3 */}
            <span
              className="flex-1 text-center rounded-full px-3 py-2 text-[11px]"
              style={{
                color: '#6b7280',
                border: '1px solid #1c2333',
                whiteSpace: 'nowrap',
              }}
            >
              Go live
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push('/companion/onboarding/profile')}
            className="w-full font-medium cursor-pointer transition-all duration-200 hover:-translate-y-px"
            style={{
              height: 52,
              background: '#e8607a',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13.5,
              boxShadow: '0 0 0 rgba(232,96,122,0)',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = '#c4485e'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                '0 8px 24px rgba(232,96,122,0.3)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = '#e8607a'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                '0 0 0 rgba(232,96,122,0)'
            }}
          >
            Let's build your profile →
          </button>

          {/* Footer */}
          <p
            className="mt-4"
            style={{ fontSize: 11, color: '#6b7280', textAlign: 'center' }}
          >
            Everything you share is encrypted and never shown publicly.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
