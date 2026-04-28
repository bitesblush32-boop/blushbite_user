'use client'

// Companion route group layout.
// /companion/legal  → bare (no chrome) — standalone sign-up flow
// Everything else   → full dreamer chrome (Header + BottomNav + MiniPlayer)

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import MiniPlayer from '@/components/layout/MiniPlayer'

const ProfileDrawer     = dynamic(() => import('@/components/ui/ProfileDrawer'),     { ssr: false })
const BookingModal      = dynamic(() => import('@/components/ui/BookingModal'),      { ssr: false })
const BottomNav         = dynamic(() => import('@/components/layout/BottomNav'),     { ssr: false })
const ProfilePostViewer = dynamic(() => import('@/components/ui/ProfilePostViewer'), { ssr: false })

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBare   = pathname === '/companion/legal' || pathname.startsWith('/companion/onboarding/legal')

  if (isBare) {
    return (
      <div className="min-h-screen bg-[#07090f] relative overflow-x-hidden">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07090f] relative overflow-x-hidden">

      {/* ── Noise texture ─────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Ambient rose glow ─────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)',
        }}
      />

      <Header />
      <MiniPlayer />

      {children}

      <ProfileDrawer />
      <BookingModal />
      <ProfilePostViewer />
      <BottomNav />
    </div>
  )
}
