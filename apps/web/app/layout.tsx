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
  description:
    'Verified companions, literary confessions, and intimate audio — curated for you alone.',
  metadataBase: new URL('https://blushbite.co'),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    url: 'https://blushbite.co',
    siteName: 'BlushBite',
    title: 'BlushBite · Private Fantasy & Companions',
    description:
      'Verified companions, literary confessions, and intimate audio — curated for you alone.',
    images: [{ url: '/bb.png', width: 1200, height: 630, alt: 'BlushBite' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlushBite · Private Fantasy & Companions',
    description:
      'Verified companions, literary confessions, and intimate audio — curated for you alone.',
    images: ['/bb.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/favicon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className={dmSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
