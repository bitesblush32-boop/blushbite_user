'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, BookOpen, Users, Compass, User } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'

const NAV_ITEMS = [
  { label: 'Home',       href: '/',            icon: Home },
  { label: 'Stories',    href: '/stories',     icon: BookOpen },
  { label: 'Companions', href: '/companions',  icon: Users },
  { label: 'Explore',    href: '/explore',     icon: Compass },
  { label: 'Me',         href: '/profile',     icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const playerVisible = !!usePlayerStore((s) => s.audioId)

  return (
    <motion.div
      className="fixed left-0 right-0 z-[800] md:hidden"
      style={{
        height: 64,
        background: 'rgba(7,9,15,0.96)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid #1c2333',
        willChange: 'transform',
        display: 'grid',
        gridTemplateColumns: 'repeat(5,1fr)',
      }}
      initial={{ y: 64, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        bottom: playerVisible ? 68 : 0,
      }}
      transition={{
        y: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
        bottom: { type: 'spring', stiffness: 380, damping: 30 },
      }}
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        const color = active ? '#e8607a' : '#4b5563'

        return (
          <motion.button
            key={href}
            whileTap={{ scale: 0.80 }}
            onClick={() => router.push(href)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              height: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Icon size={22} strokeWidth={1.5} color={color} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.03em',
                color,
                lineHeight: 1,
              }}
            >
              {label}
            </span>
            {active && (
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: '#e8607a',
                  display: 'block',
                  marginTop: 4,
                }}
              />
            )}
          </motion.button>
        )
      })}
    </motion.div>
  )
}
