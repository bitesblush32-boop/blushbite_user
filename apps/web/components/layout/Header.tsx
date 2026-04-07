'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Bell, ChevronRight, HelpCircle, LogOut, Menu, Plus, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import SlidePanel from '@/components/ui/SlidePanel'
import NotificationsPanel from '@/components/ui/NotificationsPanel'
import { useNotifications } from '@/hooks/useNotifications'

export default function Header() {
  const { data: session } = useSession()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [plusHover, setPlusHover] = useState(false)
  const avatarUrl = useUIStore(s => s.avatarUrl)
  const router = useRouter()
  const pathname = usePathname()
  const isProfile = pathname === '/profile'

  const { unreadCount } = useNotifications()

  const alias = session?.user?.alias ?? '??'
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()

  useEffect(() => {
    setSettingsOpen(false)
    setNotificationsOpen(false)
  }, [pathname])

  const menuItems = [
    {
      label: 'Privacy & safety',
      href: '/privacy',
      icon: Shield,
      tone: 'default' as const,
    },
    {
      label: 'Help & support',
      href: '/help',
      icon: HelpCircle,
      tone: 'default' as const,
    },
    {
      label: 'Sign out',
      icon: LogOut,
      tone: 'danger' as const,
      onClick: () => signOut({ callbackUrl: '/auth/signin' }),
    },
  ]

  const profileAccent = avatarUrl
    ? {
        backgroundImage: `url(${avatarUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
        color: '#fff',
      }

  return (
    <header
      className="bb-header fixed top-0 left-0 right-0 z-[900] border-b border-[#1c2333]"
      style={{
        background: 'rgba(7,9,15,0.82)',
        backdropFilter: 'blur(20px)',
        willChange: 'transform',
        height: 75,
      }}
    >
      <div
        className="px-5 md:px-8"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <div style={{ justifySelf: 'start' }}>
          <button
            type="button"
            aria-label="Write a confession"
            onClick={() => router.push('/create')}
            onMouseEnter={() => setPlusHover(true)}
            onMouseLeave={() => setPlusHover(false)}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: plusHover ? 'rgba(232,96,122,0.10)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Plus
              size={28}
              strokeWidth={2}
              color={plusHover ? '#e8607a' : '#6b7280'}
              style={{ transition: 'color 0.15s' }}
            />
          </button>
        </div>

        <div style={{ justifySelf: 'center' }}>
          <Link href="/" className="flex-shrink-0 block">
            <Image
              src="/bb.png"
              alt="BlushBite"
              width={140}
              height={1150}
              priority
              style={{ objectFit: 'contain', objectPosition: 'center', display: 'block' }}
            />
          </Link>
        </div>

        <div style={{ justifySelf: 'end' }}>
          {isProfile ? (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center rounded-full transition-all duration-150"
              style={{
                width: 40,
                height: 40,
                background: 'transparent',
                border: 'none',
                color: settingsOpen ? '#e8607a' : '#6b7280',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.10)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="flex items-center justify-center rounded-full transition-all duration-150"
              style={{
                width: 40,
                height: 40,
                background: 'transparent',
                border: 'none',
                color: notificationsOpen ? '#e8607a' : '#6b7280',
                cursor: 'pointer',
                position: 'relative',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.10)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <Bell size={22} strokeWidth={1.5} />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      background: '#e8607a',
                      border: '2px solid #07090f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#fff',
                      lineHeight: 1,
                      padding: '0 3px',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}
        </div>
      </div>

      <SlidePanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Profile settings"
        headerSlot={(
          <div className="mt-2 flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1c2333] text-[11px] font-semibold"
              style={profileAccent}
            >
              {!avatarUrl ? initials : null}
            </span>
            <div>
              <p className="text-[13px] text-[#eeeef0]">{alias}</p>
              <p className="text-[11px] text-[#4b5563]">Manage privacy, support, and account actions.</p>
            </div>
          </div>
        )}
      >
        <div className="flex flex-col gap-2">
          {menuItems.map(item => {
            const Icon = item.icon
            const isDanger = item.tone === 'danger'
            const content = (
              <>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-[12px] border"
                  style={{
                    borderColor: isDanger ? 'rgba(232,112,112,0.18)' : '#1c2333',
                    background: isDanger ? 'rgba(232,112,112,0.08)' : '#111620',
                    color: isDanger ? '#e87070' : '#e8607a',
                  }}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-[14px]" style={{ color: isDanger ? '#e87070' : '#eeeef0' }}>
                    {item.label}
                  </span>
                  <span className="block pt-1 text-[12px] text-[#4b5563]">
                    {isDanger ? 'End this session securely.' : 'Open this screen in a full-page view.'}
                  </span>
                </span>
                {!isDanger && <ChevronRight size={18} color="#4b5563" />}
              </>
            )

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center gap-3 rounded-[16px] border border-[#1c2333] bg-[#111620] px-4 py-3 transition-colors duration-150 hover:border-white/10 hover:bg-white/[0.03]"
                >
                  {content}
                </Link>
              )
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setSettingsOpen(false)
                  item.onClick?.()
                }}
                className="flex items-center gap-3 rounded-[16px] border px-4 py-3 text-left transition-colors duration-150"
                style={{
                  borderColor: '#2a1f24',
                  background: 'rgba(232,112,112,0.05)',
                }}
              >
                {content}
              </button>
            )
          })}
        </div>
      </SlidePanel>

      <SlidePanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications"
        headerSlot={(
          <span className="mt-1 block text-[12px] text-[#4b5563]">
            Updates about replies, saves, and anything that needs your attention.
          </span>
        )}
      >
        <NotificationsPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      </SlidePanel>
    </header>
  )
}
