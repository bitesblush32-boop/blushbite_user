import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { playfair, dmSans } from '@/lib/fonts'
import { Providers } from './providers'
import './globals.css'

const ProfileDrawer = dynamic(() => import('@/components/ui/ProfileDrawer'), { ssr: false })
const BookingModal  = dynamic(() => import('@/components/ui/BookingModal'),  { ssr: false })
const BottomNav     = dynamic(() => import('@/components/layout/BottomNav'), { ssr: false })

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
          <ProfileDrawer />
          <BookingModal />
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
