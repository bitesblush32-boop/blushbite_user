import type { Metadata } from 'next'
import { playfair, dmSans } from '@/lib/fonts'
import { Providers } from './providers'
import './globals.css'

// ─── Root layout ──────────────────────────────────────────────────────────────
// Minimal: fonts, providers, metadata only.
// Per-role chrome (Header, MiniPlayer, modals) lives in each route group layout:
//   app/(dreamer)/layout.tsx  — dreamer feed + profile pages
//   app/(auth)/layout.tsx     — sign-in, onboarding (no chrome)
//   app/(companion)/layout.tsx — companion portal (no dreamer chrome)

export const metadata: Metadata = {
  title: 'BlushBite · Private Fantasy & Companions',
  description: 'Verified companions, literary confessions, and intimate audio — curated for you alone.',
  robots: 'noindex, nofollow', // keep off search engines; 18+ platform
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className={dmSans.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
