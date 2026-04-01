'use client'

import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'

export default function ProfilePage() {
  const { data: session } = useSession()

  const alias = session?.user?.alias ?? '@you'
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()

  return (
    <div
      className="relative min-h-screen"
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
          background:
            'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)',
        }}
      />

      <Header />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center px-5"
        style={{ paddingTop: 120 }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 600,
            color: '#fff',
          }}
        >
          {initials}
        </div>

        {/* Alias */}
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 17,
            color: '#eeeef0',
            marginTop: 12,
          }}
        >
          {alias}
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Your private space
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            maxWidth: 280,
            height: 1,
            background: '#1c2333',
            margin: '32px auto',
          }}
        />

        {/* Stats */}
        <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Saved',              value: '—' },
            { label: 'Stories read',       value: '—' },
            { label: 'Companions viewed',  value: '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6b7280' }}>{label}</span>
              <span style={{ color: '#eeeef0' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            maxWidth: 280,
            height: 1,
            background: '#1c2333',
            margin: '32px auto',
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
          <button
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Preferences &amp; taste
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: '#e87070',
              padding: '8px 0',
            }}
          >
            Sign out
          </button>
        </div>

        {/* Phase 2 note */}
        <p
          style={{
            fontSize: 12,
            color: '#4b5563',
            fontStyle: 'italic',
            marginTop: 48,
            marginBottom: 32,
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          Full profile coming in Phase 2 — preferences, saved content, and your taste profile.
        </p>
      </motion.main>
    </div>
  )
}
