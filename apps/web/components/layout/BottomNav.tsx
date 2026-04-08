'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, BookOpen, Users, BookHeart, User } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import { useNotificationCount } from '@/hooks/useNotifications'

const NAV_ITEMS = [
  { label: 'Home',        href: '/',            icon: Home },
  { label: 'Stories',     href: '/stories',     icon: BookOpen },
  { label: 'Companions',  href: '/companions',  icon: Users },
  { label: 'Confessions', href: '/confessions', icon: BookHeart },
  { label: 'Me',          href: '/profile',     icon: User },
]

export default function BottomNav() {
  const pathname      = usePathname()
  const router        = useRouter()
  const playerVisible = !!usePlayerStore((s) => s.audioId)
  const unreadCount   = useNotificationCount()

  return (
    <motion.div
      className="bb-bottom-nav fixed left-0 right-0 z-[800]"
      style={{
        height: 64,
        width: '100%',
        background: 'rgba(7,9,15,0.96)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid #1c2333',
        willChange: 'transform',
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          width: '100%',
          height: '100%',
          alignItems: 'center',
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
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon size={22} strokeWidth={1.5} color={color} />
                {href === '/profile' && unreadCount > 0 && (
                  <span style={{
                    position:       'absolute',
                    top:            -4,
                    right:          -4,
                    background:     '#e8607a',
                    color:          '#fff',
                    fontSize:       9,
                    fontWeight:     700,
                    borderRadius:   9999,
                    minWidth:       16,
                    height:         16,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    padding:        '0 4px',
                    lineHeight:     1,
                    pointerEvents:  'none',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
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
      </div>
    </motion.div>
  )
}
