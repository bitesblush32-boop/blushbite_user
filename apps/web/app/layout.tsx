import type { Metadata } from 'next'
import { playfair, dmSans } from '@/lib/fonts'
import { Providers } from './providers'
import './globals.css'

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
