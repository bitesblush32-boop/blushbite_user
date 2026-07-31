'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { X, Megaphone, Users, Shield, HelpCircle, LogIn, Sparkles } from 'lucide-react'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  community?: string | null
  isDreamer?: boolean
  onSignIn?: () => void
}

const NAV_ITEMS = [
  {
    label: 'Advertise',
    sublabel: 'Grow your brand on BlushBite',
    href: '/advertise',
    icon: Megaphone,
    external: false,
  },
  {
    label: 'For Companions',
    sublabel: 'Join as a companion',
    href: 'https://blushbite.live',
    icon: Users,
    external: true,
  },
  {
    label: 'Privacy & Safety',
    sublabel: 'Your data, your rules',
    href: '/privacy',
    icon: Shield,
    external: false,
  },
  {
    label: 'Help & Support',
    sublabel: 'We\'re here for you',
    href: '/help',
    icon: HelpCircle,
    external: false,
  },
]

const COMMUNITY_LABEL = {
  female: { symbol: '♀', text: 'Female', color: '#e8607a', bg: 'rgba(232,96,122,0.10)', border: 'rgba(232,96,122,0.30)' },
  male:   { symbol: '♂', text: 'Male',   color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.30)'  },
  ts:     { symbol: '⚧', text: 'TS',     color: '#c084fc', bg: 'rgba(192,132,252,0.10)', border: 'rgba(192,132,252,0.30)' },
}

export default function MobileMenu({ open, onClose, community, isDreamer, onSignIn }: MobileMenuProps) {
  const [mounted, setMounted] = useState(false)
  const dragY = useMotionValue(0)
  const opacity = useTransform(dragY, [0, 300], [1, 0])
  const sheetOpacity = useTransform(dragY, [0, 200], [1, 0.6])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const communityKey = community === 'female' ? 'female' : community === 'male' ? 'male' : community === 'ts' ? 'ts' : null
  const communityMeta = communityKey ? COMMUNITY_LABEL[communityKey] : null

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[2100]"
            style={{ background: 'rgba(0,0,0,0.70)', opacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed left-0 right-0 bottom-0 z-[2110] mx-auto"
            style={{
              maxWidth: 480,
              borderRadius: '24px 24px 0 0',
              background: '#0d1117',
              border: '1px solid #1c2333',
              borderBottom: 'none',
              boxShadow: '0 -12px 60px rgba(0,0,0,0.55)',
              willChange: 'transform',
              y: dragY,
              opacity: sheetOpacity,
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose()
              else dragY.set(0)
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-[14px] pb-[6px] cursor-grab active:cursor-grabbing">
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 99,
                  background: '#2a3344',
                }}
              />
            </div>

            {/* Header Row */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4">
              <div>
                <span
                  className="block text-[18px] text-[#eeeef0]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Menu
                </span>
                {communityMeta && (
                  <span
                    className="mt-1 inline-flex items-center gap-[5px] text-[11px] font-medium rounded-full px-[9px] py-[3px]"
                    style={{
                      color: communityMeta.color,
                      background: communityMeta.bg,
                      border: `1px solid ${communityMeta.border}`,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {communityMeta.symbol} {communityMeta.text} community
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex items-center justify-center rounded-full transition-colors duration-150"
                style={{
                  width: 36,
                  height: 36,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid #1c2333',
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#1c2333', margin: '0 20px' }} />

            {/* Nav Items */}
            <nav className="px-3 pt-3 pb-2">
              {NAV_ITEMS.map((item, i) => {
                const Icon = item.icon
                // Hide "For Companions" if signed in
                if (item.label === 'For Companions' && isDreamer) return null

                const inner = (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.045, duration: 0.2, type: 'tween' }}
                    className="group flex items-center gap-4 w-full px-3 py-[13px] rounded-[14px] transition-colors duration-150"
                    style={{
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                    whileTap={{ scale: 0.98, backgroundColor: 'rgba(232,96,122,0.06)' }}
                  >
                    <span
                      className="flex items-center justify-center rounded-[12px] flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: 'rgba(232,96,122,0.08)',
                        border: '1px solid rgba(232,96,122,0.15)',
                        color: '#e8607a',
                      }}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-[#eeeef0] font-medium leading-snug">
                        {item.label}
                      </p>
                      <p className="text-[12px] text-[#4b5563] mt-[2px] truncate">
                        {item.sublabel}
                      </p>
                    </div>
                    {item.external && (
                      <svg width="12" height="12" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.35, flexShrink: 0 }}>
                        <path d="M1 9L9 1M9 1H3M9 1V7" stroke="#eeeef0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </motion.div>
                )

                if (item.external) {
                  return (
                    <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClose} style={{ textDecoration: 'none', display: 'block' }}>
                      {inner}
                    </a>
                  )
                }
                return (
                  <Link key={item.label} href={item.href} onClick={onClose} style={{ textDecoration: 'none', display: 'block' }}>
                    {inner}
                  </Link>
                )
              })}
            </nav>

            {/* Auth CTA — logged out only */}
            {!isDreamer && (
              <>
                <div style={{ height: 1, background: '#1c2333', margin: '4px 20px 12px' }} />
                <div className="px-4 pb-4" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
                  <button
                    type="button"
                    onClick={() => { onClose(); onSignIn?.() }}
                    className="w-full flex items-center justify-center gap-2 rounded-[12px] text-[14px] font-semibold text-white transition-all duration-150"
                    style={{
                      height: 48,
                      background: 'linear-gradient(135deg, #e8607a 0%, #c4485e 100%)',
                      border: 'none',
                      boxShadow: '0 6px 24px rgba(232,96,122,0.28)',
                      cursor: 'pointer',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <Sparkles size={16} strokeWidth={2} />
                    Enter your world
                  </button>
                  <p className="text-center text-[11px] text-[#4b5563] mt-[10px]">
                    Strictly 18+ · Your identity stays private
                  </p>
                </div>
              </>
            )}

            {/* Safe area for logged-in (no CTA) */}
            {isDreamer && (
              <div style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
