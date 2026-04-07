'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Activity,
  Users2,
  User,
  FileText,
  Headphones,
  PenLine,
  CalendarDays,
  Tags,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react'

interface BadgeCounts {
  pending_companions: number
  pending_stories:    number
  pending_audio:      number
  open_bookings:      number
}

function NavGroup({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1"
      style={{ fontSize: 9, letterSpacing: '0.1em', color: '#6b7280', textTransform: 'uppercase', fontWeight: 500 }}>
      {label}
    </p>
  )
}

function Badge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span
      className="ml-auto text-[10px] px-2 py-px rounded-full"
      style={{ background: 'rgba(232,96,122,0.15)', color: '#e8607a', border: '1px solid rgba(232,96,122,0.25)' }}
    >
      {count}
    </span>
  )
}

function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  exact,
  onClick,
}: {
  href:    string
  icon:    React.ElementType
  label:   string
  badge?:  number
  exact?:  boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-[9px] text-[13px] transition-all duration-150 w-full rounded-[10px]"
      style={isActive
        ? { background: 'rgba(232,96,122,0.10)', color: '#eeeef0', border: '1px solid rgba(232,96,122,0.20)' }
        : { color: '#6b7280', border: '1px solid transparent' }
      }
      onMouseEnter={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLElement
          el.style.color = '#eeeef0'
          el.style.background = 'rgba(255,255,255,0.04)'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          const el = e.currentTarget as HTMLElement
          el.style.color = '#6b7280'
          el.style.background = ''
        }
      }}
    >
      <Icon size={15} />
      <span>{label}</span>
      {badge !== undefined && <Badge count={badge} />}
    </Link>
  )
}

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const { data: counts } = useQuery<BadgeCounts>({
    queryKey: ['admin', 'counts'],
    queryFn:  () => fetch('/api/admin/stats/counts').then(r => r.json()),
    refetchInterval: 30_000,
    initialData: { pending_companions: 0, pending_stories: 0, pending_audio: 0, open_bookings: 0 },
  })

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#0a0c14' }}>
      {/* Logo */}
      <div className="p-5 pb-4 border-b border-[#1c2333]">
        <Image src="/logo_light.png" alt="BlushBite" width={80} height={24} />
        <div className="mt-3">
          <span
            className="text-[10px] tracking-[0.08em] uppercase px-3 py-1 rounded-full"
            style={{ color: '#c9a96e', background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)' }}
          >
            Admin Panel
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-[2px] p-3 flex-1">
        {/* Overview */}
        <NavItem href="/admin"          icon={LayoutDashboard} label="Dashboard"    exact onClick={onNav} />
        <NavItem href="/admin/activity" icon={Activity}        label="Activity Feed"       onClick={onNav} />

        {/* People */}
        <NavGroup label="People" />
        <NavItem href="/admin/companions" icon={Users2} label="Companions" badge={counts?.pending_companions} onClick={onNav} />
        <NavItem href="/admin/users"      icon={User}   label="Dreamers"                                      onClick={onNav} />

        {/* Content */}
        <NavGroup label="Content" />
        <NavItem href="/admin/content"        icon={FileText}   label="Stories"    badge={counts?.pending_stories} onClick={onNav} />
        <NavItem href="/admin/audio"          icon={Headphones} label="Audio"      badge={counts?.pending_audio}   onClick={onNav} />
        <NavItem href="/admin/content/create" icon={PenLine}    label="Write Story"                                onClick={onNav} />

        {/* Operations */}
        <NavGroup label="Operations" />
        <NavItem href="/admin/bookings" icon={CalendarDays} label="Bookings"    badge={counts?.open_bookings} onClick={onNav} />
        <NavItem href="/admin/tags"     icon={Tags}         label="Tag Library"                               onClick={onNav} />
      </nav>

      {/* Separator */}
      <div className="h-px bg-[#1c2333] mx-3" />

      {/* Bottom */}
      <div className="p-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-[9px] rounded-[10px] transition-all duration-150"
          style={{ fontSize: 12, color: '#6b7280' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#eeeef0' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6b7280' }}
        >
          <ExternalLink size={13} />
          ← Back to platform
        </Link>
      </div>
    </div>
  )
}

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#07090f' }}>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[240px] border-r border-[#1c2333] z-[100]"
        style={{ background: '#0a0c14' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 h-[56px] border-b border-[#1c2333] flex items-center justify-between px-4 z-50"
        style={{ background: 'rgba(7,9,15,0.90)', backdropFilter: 'blur(20px)' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="w-[36px] h-[36px] flex items-center justify-center rounded-[8px] transition-colors"
          style={{ color: '#6b7280' }}
        >
          <Menu size={20} />
        </button>
        <Image src="/logo_light.png" alt="BlushBite" width={60} height={18} />
        <span
          className="text-[10px] tracking-[0.08em] uppercase px-3 py-1 rounded-full"
          style={{ color: '#c9a96e', background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)' }}
        >
          Admin
        </span>
      </header>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] md:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.60)' }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -240, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -240, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-0 h-full w-[240px] border-r border-[#1c2333]"
              style={{ background: '#0a0c14' }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-[28px] h-[28px] flex items-center justify-center rounded-full transition-colors"
                style={{ color: '#6b7280', background: 'rgba(255,255,255,0.05)' }}
              >
                <X size={14} />
              </button>
              <SidebarContent onNav={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="md:ml-[240px] ml-0 pt-0 md:pt-0 pt-[56px] min-h-screen" style={{ color: '#eeeef0' }}>
        <div className="md:pt-0 pt-[56px]">
          {children}
        </div>
      </main>
    </div>
  )
}
