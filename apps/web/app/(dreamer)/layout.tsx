'use client'

// Dreamer route group layout — shared chrome for all dreamer (user) pages.
// Provides: fixed Header, fixed MiniPlayer, noise texture, ambient glow,
// ProfileDrawer & BookingModal (lazy-loaded, ssr:false).
// Used by: / (home), /companions, /stories, /audio, /explore, /profile, etc.

import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import MiniPlayer from '@/components/layout/MiniPlayer'
import BottomNav from '@/components/layout/BottomNav'

const ProfileDrawer = dynamic(() => import('@/components/ui/ProfileDrawer'), { ssr: false })
const BookingModal = dynamic(() => import('@/components/ui/BookingModal'), { ssr: false })
const ProfilePostViewer = dynamic(() => import('@/components/ui/ProfilePostViewer'), { ssr: false })
const LocationBanner = dynamic(() => import('@/components/ui/LocationBanner'), { ssr: false })
const AuthModal = dynamic(() => import('@/components/ui/AuthModal'), { ssr: false })
const DreamerSessionInit = dynamic(() => import('@/components/ui/DreamerSessionInit'), { ssr: false })
const TourOverlay = dynamic(
  () => import('@/components/ui/TourOverlay').then((m) => ({ default: m.TourOverlay })),
  { ssr: false }
)

export default function DreamerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07090f] relative overflow-x-hidden">
      {/* ── Noise texture — fixed, always on top, zero interaction cost ────── */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Ambient rose glow — absolute so it scrolls with content ─────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ── Fixed chrome ─────────────────────────────────────────────────── */}
      <Header />
      <MiniPlayer />

      {/* ── Page content ─────────────────────────────────────────────────── */}
      {children}

      {/* ── Global modals/drawers (lazy, ssr:false — not in initial bundle) ── */}
      <ProfileDrawer />
      <BookingModal />
      <ProfilePostViewer />
      <BottomNav />
      <LocationBanner />
      <TourOverlay />
      <AuthModal />
      <DreamerSessionInit />
    </div>
  )
}
