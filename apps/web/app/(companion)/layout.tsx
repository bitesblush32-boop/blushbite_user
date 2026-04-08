'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, CalendarDays, User, Film, Settings } from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',  href: '/companion/dashboard'    },
  { icon: CalendarDays,    label: 'Bookings',    href: '/companion/bookings',    badge: true },
  { icon: User,            label: 'My Profile',  href: '/companion/profile/edit' },
  { icon: Film,            label: 'My Content',  href: '/companion/content'      },
  { icon: Settings,        label: 'Settings',    href: '/companion/settings'     },
]

const BARE_PREFIXES = ['/companion/onboarding', '/companion/welcome']

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBare   = BARE_PREFIXES.some(p => pathname.startsWith(p))

  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (isBare) return
    fetch('/api/companions/dashboard/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (typeof d.pending_bookings === 'number') setPendingCount(d.pending_bookings) })
      .catch(() => {})
  }, [isBare])

  if (isBare) return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090f' }}>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-30"
        style={{ width: 220, background: '#0a0c14', borderRight: '1px solid #1c2333' }}>

        {/* Logo */}
        <div style={{ paddingTop: 24, paddingLeft: 24, marginBottom: 32 }}>
          <Link href="/companion/dashboard">
            <Image src="/logo_light.png" alt="BlushBite" width={80} height={26} style={{ objectFit: 'contain' }} priority />
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {NAV.map(({ icon: Icon, label, href, badge }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 13.5, fontWeight: active ? 500 : 400,
                  color:      active ? '#eeeef0' : '#6b7280',
                  background: active ? 'rgba(232,96,122,0.1)' : 'transparent',
                  border:     active ? '1px solid rgba(232,96,122,0.2)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.color = '#eeeef0'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)' } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.color = '#6b7280'; (e.currentTarget as HTMLDivElement).style.background = 'transparent' } }}>
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && pendingCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#c9a96e', background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 999, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>
                      {pendingCount}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #1c2333', padding: '16px 20px' }}>
          <Link href="/" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none', display: 'block', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#eeeef0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280' }}>
            ← Back to platform
          </Link>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="flex md:hidden fixed top-0 left-0 right-0 z-30 items-center justify-around"
        style={{ height: 56, background: '#0a0c14', borderBottom: '1px solid #1c2333' }}>
        {NAV.map(({ icon: Icon, href, badge, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} title={label}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10,
                color:      active ? '#e8607a' : '#6b7280',
                background: active ? 'rgba(232,96,122,0.08)' : 'transparent',
              }}>
              <Icon size={18} />
              {badge && pendingCount > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#c9a96e', display: 'block' }} />
              )}
            </Link>
          )
        })}
      </div>

      {/* ── Main content ── */}
      <main className="md:ml-[220px] mt-[56px] md:mt-0 flex-1"
        style={{ minHeight: '100vh', background: '#07090f', padding: 32 }}>
        {children}
      </main>
    </div>
  )
}
