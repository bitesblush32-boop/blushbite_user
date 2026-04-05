'use client'

import { useRef, useEffect, useState, forwardRef } from 'react'
// @ts-ignore — react-pageflip types are loose
import HTMLFlipBook from 'react-pageflip'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  pages:          string[]
  pageImageUrls?: string[]
  currentPage:    number
  onPageChange:   (n: number) => void
}

// react-pageflip clones each child with a ref — forwardRef required
const FlipPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <div
      ref={ref}
      style={{
        width:      '100%',
        height:     '100%',
        background: '#07090f',
        overflow:   'hidden',
      }}
    >
      {children}
    </div>
  )
)
FlipPage.displayName = 'FlipPage'

export function StoryPageContent({ pages, pageImageUrls, currentPage, onPageChange }: Props) {
  const bookRef      = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const prevPage     = useRef(currentPage)

  const useImages = Array.isArray(pageImageUrls) && pageImageUrls.length > 0
  const total     = useImages ? pageImageUrls!.length : pages.length

  // Measure container once on mount
  useEffect(() => {
    if (!containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    setDims({ w: Math.floor(width), h: Math.floor(height) })
  }, [])

  // Sync when ConfessionCard resets currentPage to 0 (card becomes inactive)
  useEffect(() => {
    if (currentPage !== prevPage.current && bookRef.current) {
      bookRef.current.pageFlip().turnToPage(currentPage)
      prevPage.current = currentPage
    }
  }, [currentPage])

  function goTo(n: number) {
    if (n < 0 || n >= total) return
    const pf = bookRef.current?.pageFlip()
    if (!pf) return
    // flipNext/flipPrev both play the full animated curl in the correct direction
    if (n > currentPage) {
      pf.flipNext('bottom')
    } else {
      pf.flipPrev('bottom')
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
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

      {/* Only render once we have real dimensions */}
      {dims.w > 0 && dims.h > 0 && (
        <HTMLFlipBook
          ref={bookRef}
          width={dims.w}
          height={dims.h}
          size="fixed"
          minWidth={50}
          maxWidth={4000}
          minHeight={50}
          maxHeight={4000}
          drawShadow={true}
          flippingTime={700}
          usePortrait={true}
          startZIndex={0}
          autoSize={false}
          showCover={false}
          mobileScrollSupport={false}
          useMouseEvents={true}
          style={{ touchAction: 'none' }}
          className=""
          startPage={0}
          onFlip={(e: { data: number }) => {
            onPageChange(e.data)
            prevPage.current = e.data
          }}
        >
          {useImages
            ? pageImageUrls!.map((url, i) => (
                <FlipPage key={i}>
                  <img
                    src={url}
                    alt=""
                    style={{
                      width:     '100%',
                      height:    '100%',
                      objectFit: 'contain',
                      display:   'block',
                    }}
                  />
                </FlipPage>
              ))
            : pages.map((text, i) => (
                <FlipPage key={i}>
                  <div
                    style={{
                      height:         '100%',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      padding:        '48px 32px',
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
                      {text}
                    </p>
                  </div>
                </FlipPage>
              ))
          }
        </HTMLFlipBook>
      )}
    </div>
  )
}
