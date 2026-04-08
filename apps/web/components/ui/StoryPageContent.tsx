'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  pages:          string[]
  pageImageUrls?: string[]
  currentPage:    number
  onPageChange:   (n: number) => void
}

// Adapt flip duration to device capability — GPU-only animation either way
function getFlipMs(): number {
  if (typeof navigator === 'undefined') return 340
  const cores = navigator.hardwareConcurrency ?? 4
  return cores < 4 ? 240 : 340
}

export function StoryPageContent({ pages, pageImageUrls, currentPage, onPageChange }: Props) {
  const useImages = Array.isArray(pageImageUrls) && pageImageUrls.length > 0
  const total     = useImages ? pageImageUrls!.length : pages.length

  // Debug log
  // useEffect(() => {
  //   console.log('🖼️ StoryPageContent debug:', {
  //     useImages,
  //     imageCount: pageImageUrls?.length ?? 0,
  //     textPageCount: pages.length,
  //     total,
  //     currentPage,
  //   })
  // }, [useImages, total, currentPage, pageImageUrls?.length, pages.length])

  // Stably-displayed page index
  const [displayPage, setDisplayPage]     = useState(currentPage)
  // Page being flipped to (null = idle)
  const [incomingPage, setIncomingPage]   = useState<number | null>(null)
  // Active flip direction (null = idle)
  const [flipDir, setFlipDir]             = useState<'forward' | 'backward' | null>(null)

  const isFlipping   = useRef(false)
  const prevPropPage = useRef(currentPage)
  const FLIP_MS      = useRef(340)

  useEffect(() => {
    FLIP_MS.current = getFlipMs()
  }, [])

  // Sync when parent resets currentPage (card becomes inactive → reset to page 0)
  useEffect(() => {
    if (currentPage === prevPropPage.current) return
    prevPropPage.current = currentPage
    setDisplayPage(currentPage)
    setIncomingPage(null)
    setFlipDir(null)
    isFlipping.current = false
  }, [currentPage])

  function goTo(target: number) {
    if (target < 0 || target >= total || isFlipping.current || target === displayPage) return
    const dir: 'forward' | 'backward' = target > displayPage ? 'forward' : 'backward'
    isFlipping.current = true
    setIncomingPage(target)
    setFlipDir(dir)

    setTimeout(() => {
      setDisplayPage(target)
      setIncomingPage(null)
      setFlipDir(null)
      isFlipping.current = false
      onPageChange(target)
      prevPropPage.current = target
    }, FLIP_MS.current)
  }

  // ── Swipe detection (horizontal dominant swipes only) ──────────────────────
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const SWIPE_PX    = 40

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null
    // Ignore vertical-dominant or sub-threshold gestures
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dy) > Math.abs(dx) * 0.8) return
    // Stop propagation so parent's double-tap handler is not triggered
    e.stopPropagation()
    if (dx < 0) goTo(displayPage + 1)
    else        goTo(displayPage - 1)
  }

  // ── Render page content ─────────────────────────────────────────────────────
  function renderContent(idx: number) {
    if (useImages) {
      return (
        <img
          src={pageImageUrls![idx]}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      )
    }
    return (
      <div
        style={{
          height:         '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '48px 32px',
        }}
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
          {pages[idx]}
        </p>
      </div>
    )
  }

  // ── Animation inline styles for the outgoing page ──────────────────────────
  // Uses only transform + opacity — both compositor-thread, zero layout cost.
  const outgoingStyle: React.CSSProperties = {
    position:                'absolute',
    inset:                   0,
    background:              '#07090f',
    zIndex:                  2,
    animationName:           flipDir === 'forward'
                               ? 'bbFlipOutForward'
                               : flipDir === 'backward'
                               ? 'bbFlipOutBackward'
                               : 'none',
    animationDuration:       `${FLIP_MS.current}ms`,
    animationFillMode:       'forwards',
    animationTimingFunction: 'ease-in-out',
    transformOrigin:         flipDir === 'forward'
                               ? 'left center'
                               : flipDir === 'backward'
                               ? 'right center'
                               : 'center',
  }

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#07090f' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Incoming page — static behind, revealed as outgoing flips away ── */}
      {incomingPage !== null && (
        <div style={{ position: 'absolute', inset: 0, background: '#07090f', zIndex: 1 }}>
          {renderContent(incomingPage)}
        </div>
      )}

      {/* ── Outgoing (current) page — animates away on flip ──────────────── */}
      <div style={outgoingStyle}>
        {renderContent(displayPage)}
      </div>

      {/* ── Tap zones: 15 % left = prev, 15 % right = next ──────────────── */}
      {displayPage > 0 && (
        <div
          onClick={e => { e.stopPropagation(); goTo(displayPage - 1) }}
          style={{ position: 'absolute', left: 0, top: 0, width: '15%', height: '100%', zIndex: 10, cursor: 'pointer' }}
        />
      )}
      {displayPage < total - 1 && (
        <div
          onClick={e => { e.stopPropagation(); goTo(displayPage + 1) }}
          style={{ position: 'absolute', right: 0, top: 0, width: '15%', height: '100%', zIndex: 10, cursor: 'pointer' }}
        />
      )}

      {/* ── Desktop arrow buttons — hidden on mobile ─────────────────────── */}
      {displayPage > 0 && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); goTo(displayPage - 1) }}
          className="absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center rounded-full transition-opacity duration-200"
          style={{
            left:       8,
            width:      36,
            height:     36,
            background: 'rgba(255,255,255,0.06)',
            color:      'rgba(255,255,255,0.5)',
            border:     'none',
            cursor:     'pointer',
            opacity:    0.15,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.15' }}
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {displayPage < total - 1 && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); goTo(displayPage + 1) }}
          className="absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center rounded-full transition-opacity duration-200"
          style={{
            right:      8,
            width:      36,
            height:     36,
            background: 'rgba(255,255,255,0.06)',
            color:      'rgba(255,255,255,0.5)',
            border:     'none',
            cursor:     'pointer',
            opacity:    0.15,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.15' }}
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  )
}
