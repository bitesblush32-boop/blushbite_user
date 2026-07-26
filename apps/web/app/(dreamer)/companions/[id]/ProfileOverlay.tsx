'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Props {
  children: React.ReactNode
  accentColor: string
}

export default function ProfileOverlay({ children, accentColor }: Props) {
  const router = useRouter()

  // Lock body scroll while overlay is mounted
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  function handleClose() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    // Backdrop — click outside card to close
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(7,9,15,0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'flex-end',   // mobile: sheet from bottom
        justifyContent: 'center',
        overflowY: 'auto',
      }}
      // Desktop: center the card with padding
      className="md:items-center md:p-5 lg:p-10"
    >
      {/* Modal card — stops click from bubbling to backdrop */}
      <motion.div
        initial={{ y: '45%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          // Use dvh for iOS Safari URL bar awareness
          maxHeight: '92dvh',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#0d1117',
          // Mobile: bottom sheet corners
          borderRadius: '20px 20px 0 0',
          border: '1px solid #1c2333',
          borderBottom: 'none',
          position: 'relative',
          // iOS momentum scrolling
          WebkitOverflowScrolling: 'touch' as never,
          scrollbarWidth: 'none' as never,
        }}
        // Mobile: max 560px centred | Desktop: up to 920px for wide 2-col layout
        className="max-w-[560px] md:max-w-[920px] md:rounded-[20px] md:border-b md:border-[#1c2333]"
      >
        {/* ── Sticky zero-height wrapper for close button ──────────────────
            height:0 + overflow:visible means it takes no space in the flow
            but the absolutely-positioned button inside stays visible.
            position:sticky keeps it pinned to the top of the scroll container
            as the user scrolls down — close button is always reachable. ── */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: 0,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <button
            onClick={handleClose}
            aria-label="Close profile"
            style={{
              pointerEvents: 'auto',
              position: 'absolute',
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(7,9,15,0.85)',
              border: '1px solid rgba(28,35,51,0.95)',
              color: '#9ca3af',
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.15s, color 0.15s',
              // Ensure it stays above photo overlay gradients
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.borderColor = accentColor
              el.style.color = accentColor
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.borderColor = 'rgba(28,35,51,0.95)'
              el.style.color = '#9ca3af'
            }}
          >
            ✕
          </button>
        </div>

        {children}
      </motion.div>
    </motion.div>
  )
}
