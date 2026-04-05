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

  return (
    <div
      style={{ touchAction: 'pan-y', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Desktop prev arrow */}
      {currentPage > 0 && (
        <button
          type="button"
          onClick={() => goTo(currentPage - 1)}
          className="absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center rounded-full transition-opacity duration-200"
          style={{ left: 8, width: 36, height: 36, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', opacity: 0.15 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.15' }}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Desktop next arrow */}
      {currentPage < total - 1 && (
        <button
          type="button"
          onClick={() => goTo(currentPage + 1)}
          className="absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center rounded-full transition-opacity duration-200"
          style={{ right: 8, width: 36, height: 36, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', opacity: 0.15 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.15' }}
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
            // Text mode — premium ereader layout
            <div
              style={{
                height:   '100%',
                display:  'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 32px',
              }}
              className="md:px-[56px] md:py-[64px]"
            >
              <p
                style={{
                  fontFamily:    "'Playfair Display', serif",
                  fontSize:      20,
                  color:         '#eeeef0',
                  lineHeight:    2.0,
                  letterSpacing: '0.02em',
                  whiteSpace:    'pre-wrap',
                  width:         '100%',
                }}
              >
                {pages[currentPage]}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  )
}
