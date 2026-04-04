'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  pages:          string[]
  pageImageUrls?: string[]
  currentPage:    number
  onPageChange:   (n: number) => void
}

export function StoryPageContent({ pages, pageImageUrls, currentPage, onPageChange }: Props) {
  const [direction, setDirection] = useState(0)
  const touch = useRef({ startX: 0, startY: 0, dir: '', locked: false })

  const useImages = Array.isArray(pageImageUrls) && pageImageUrls.length > 0
  const total     = useImages ? pageImageUrls!.length : pages.length

  const goTo = (n: number) => {
    if (n < 0 || n >= total) return
    setDirection(n > currentPage ? 1 : -1)
    onPageChange(n)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touch.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, dir: '', locked: false }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const t = touch.current
    if (t.locked) {
      if (t.dir === 'horizontal') e.preventDefault()
      return
    }
    const dx   = e.touches[0].clientX - t.startX
    const dy   = e.touches[0].clientY - t.startY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 10) return
    const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI)
    t.dir    = (angle < 30 || angle > 150) ? 'horizontal' : 'vertical'
    t.locked = true
    if (t.dir === 'horizontal') e.preventDefault()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const t  = touch.current
    if (t.dir !== 'horizontal') return
    const dx = e.changedTouches[0].clientX - t.startX
    if (dx < -50) goTo(currentPage + 1)
    else if (dx > 50) goTo(currentPage - 1)
  }

  const variants = {
    enter:  (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  }

  const MAX_DOTS = 8
  const dotCount = Math.min(total, MAX_DOTS)

  return (
    <div
      style={{ touchAction: 'pan-y', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Page indicator dots */}
      {total > 1 && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10"
          style={{ top: 16, gap: 5 }}
        >
          {Array.from({ length: dotCount }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width:      i === currentPage ? 6 : 4,
                height:     i === currentPage ? 6 : 4,
                background: i === currentPage ? '#e8607a' : '#2a3040',
              }}
            />
          ))}
          {total > MAX_DOTS && (
            <span style={{ fontSize: 10, color: '#2a3040', marginLeft: 2 }}>…</span>
          )}
        </div>
      )}

      {/* Desktop prev arrow */}
      {currentPage > 0 && (
        <button
          type="button"
          onClick={() => goTo(currentPage - 1)}
          className="absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
          style={{ left: 8, width: 36, height: 36, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)', border: 'none', cursor: 'pointer' }}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Desktop next arrow */}
      {currentPage < total - 1 && (
        <button
          type="button"
          onClick={() => goTo(currentPage + 1)}
          className="absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
          style={{ right: 8, width: 36, height: 36, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)', border: 'none', cursor: 'pointer' }}
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Page content */}
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={currentPage}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
        >
          {useImages ? (
            // Image mode — the pre-rendered JPG IS the page
            <img
              src={pageImageUrls![currentPage]}
              alt=""
              style={{
                width:      '100%',
                height:     '100%',
                objectFit:  'contain',
                borderRadius: 8,
                display:    'block',
              }}
            />
          ) : (
            // Text mode — legacy fallback
            <div style={{ overflowY: 'auto', padding: '32px 24px', height: '100%' }} className="md:px-10 md:py-10">
              <p
                style={{
                  fontFamily:    "'Playfair Display', serif",
                  fontSize:      19,
                  color:         '#eeeef0',
                  lineHeight:    1.95,
                  letterSpacing: '0.01em',
                  whiteSpace:    'pre-wrap',
                  paddingTop:    total > 1 ? 24 : 0,
                }}
                className="md:text-[19px] text-[17px]"
              >
                {pages[currentPage]}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Page turn label (text mode only) */}
      {!useImages && total > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10">
          <span style={{ fontSize: 10, color: '#2a3040' }}>
            Page {currentPage + 1} of {total}
          </span>
        </div>
      )}
    </div>
  )
}
