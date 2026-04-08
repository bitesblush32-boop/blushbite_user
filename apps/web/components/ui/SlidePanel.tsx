'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

interface SlidePanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  widthClassName?: string
  bodyClassName?: string
  headerSlot?: ReactNode
}

export default function SlidePanel({
  open,
  onClose,
  title,
  children,
  widthClassName = 'md:w-[420px]',
  bodyClassName = 'px-5 py-6',
  headerSlot,
}: SlidePanelProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function checkViewport() {
      setIsMobile(window.innerWidth < 768)
    }

    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  useEffect(() => {
    if (!open) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  const motionProps = isMobile
    ? {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
        transition: { type: 'spring' as const, stiffness: 380, damping: 38 },
      }
    : {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        transition: { type: 'spring' as const, stiffness: 380, damping: 38 },
      }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label={`Close ${title}`}
            className="fixed inset-0 z-[2100] cursor-default"
            style={{ background: 'rgba(0,0,0,0.62)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.aside
            {...motionProps}
            aria-modal="true"
            role="dialog"
            aria-label={title}
            className={[
              'fixed z-[2110] overflow-y-auto',
              'bottom-0 left-0 right-0',
              `md:bottom-0 md:top-0 md:left-auto md:right-0 ${widthClassName}`,
            ].join(' ')}
            style={{
              background: '#0d1117',
              borderTop: isMobile ? '1px solid #1c2333' : 'none',
              borderLeft: isMobile ? 'none' : '1px solid #1c2333',
              borderRadius: isMobile ? '20px 20px 0 0' : 0,
              maxHeight: isMobile ? '92vh' : '100vh',
              boxShadow: isMobile ? '0 -18px 48px rgba(0,0,0,0.45)' : '0 0 48px rgba(0,0,0,0.4)',
              willChange: 'transform',
            }}
          >
            <div
              className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#1c2333] px-5 py-4"
              style={{ background: '#0d1117' }}
            >
              <div className="min-w-0">
                <span
                  className="block truncate"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#eeeef0' }}
                >
                  {title}
                </span>
                {headerSlot}
              </div>

              <button
                type="button"
                aria-label={`Close ${title}`}
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#1c2333] text-[16px] text-[#6b7280] transition-colors duration-150"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                x
              </button>
            </div>

            <div className={bodyClassName}>{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
    ,
    document.body
  )
}
