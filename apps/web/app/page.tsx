'use client'

import { motion } from 'framer-motion'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07090f] flex items-center justify-center relative overflow-hidden">

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="text-center relative z-10 px-5 max-w-[480px] w-full"
      >
        <p className="text-[11px] text-[#e8607a] uppercase tracking-[0.12em] mb-4">
          your world
        </p>
        <h1
          className="text-[40px] text-[#eeeef0] leading-tight mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Your world is
          <br />
          <em style={{ fontStyle: 'italic', color: '#e8607a' }}>being built.</em>
        </h1>
        <p className="text-[14px] text-[#6b7280] leading-[1.7] max-w-[360px] mx-auto mb-10">
          The feed is on its way. Your taste is already shaping it.
        </p>

        {/* Shimmer loading bar */}
        <div
          className="relative h-[3px] w-full max-w-[280px] mx-auto rounded-full overflow-hidden"
          style={{ background: '#1c2333' }}
        >
          <div
            className="absolute inset-y-0 w-1/2 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #e8607a, transparent)',
              animation: 'shimmer 1.8s ease-in-out infinite',
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}
