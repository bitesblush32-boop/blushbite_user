'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useBridgeMutation } from '@/hooks/useBridgeMutation'
import { useUIStore } from '@/store/uiStore'
import { computePages, paginateText, FONT_SIZE_PX, FONT_SIZE_CHARS } from '@/lib/paginateText'
import type { FontSize } from '@/lib/paginateText'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BridgeCompanion {
  id: string
  companion_id: string
  alias: string | null
  name: string | null
  tagline: string | null
  city: string | null
  availability_status: string
  photo_url: string | null
}

interface Props {
  rawText: string
  pageImageUrls?: string[]
  currentPage: number
  onPageChange: (n: number) => void
  onTotalPages?: (n: number) => void
  storyId: string
  gradient: string
  fontSize?: FontSize
  /** Set false to hide the bridge companion page (e.g. preview mode) */
  showBridgePage?: boolean
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: (d: number) => ({ x: d >= 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (d: number) => ({ x: d >= 0 ? '-100%' : '100%' }),
}

// ─── BridgePage ───────────────────────────────────────────────────────────────

function BridgePage({ storyId, gradient }: { storyId: string; gradient: string }) {
  const openModal = useUIStore((s) => s.openModal)
  const { isCompanion, bridgeStatus, loading, bridge } = useBridgeMutation(storyId)

  const { data, isLoading } = useQuery<{ data: BridgeCompanion[] }>({
    queryKey: ['story-bridges', storyId],
    queryFn: () => fetch(`/api/stories/${storyId}/bridges`).then((r) => r.json()),
    enabled: !!storyId,
    staleTime: 60_000,
  })
  const companions = data?.data ?? []
  const shown = companions.slice(0, 12)
  const extra = companions.length - 12

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: gradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
          opacity: 0.6,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          padding: '64px 32px 32px',
          width: '100%',
          maxWidth: 360,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#e8607a',
            background: 'rgba(232,96,122,0.1)',
            border: '1px solid rgba(232,96,122,0.2)',
            borderRadius: 999,
            padding: '4px 16px',
          }}
        >
          Companions who live this story
        </span>

        {isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 8,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#1c2333',
                  animation: 'bb-shimmer 1.4s ease-in-out infinite',
                  opacity: 0.6 - i * 0.15,
                }}
              />
            ))}
          </div>
        ) : companions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <p
              style={{
                fontSize: 13,
                color: '#4b5563',
                fontStyle: 'italic',
                textAlign: 'center',
                margin: 0,
              }}
            >
              No companions linked yet.
            </p>
            {isCompanion && bridgeStatus === 'idle' && (
              <button
                onClick={bridge}
                disabled={loading}
                style={{
                  fontSize: 12,
                  color: '#e8607a',
                  background: 'none',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  marginTop: 4,
                  padding: 0,
                }}
              >
                Be the first to bridge yourself with this story →
              </button>
            )}
            {isCompanion && bridgeStatus === 'pending' && (
              <p style={{ fontSize: 12, color: '#c9a96e', margin: 0 }}>
                Your request is pending review.
              </p>
            )}
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 8,
              }}
            >
              {shown.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openModal(c.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fff',
                    }}
                  >
                    {c.photo_url ? (
                      <Image
                        src={c.photo_url}
                        alt={c.alias ?? ''}
                        width={36}
                        height={36}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    ) : (
                      (c.alias ?? c.name ?? '?').replace('@', '').charAt(0).toUpperCase()
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      color: '#6b7280',
                      maxWidth: 40,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {c.alias ?? c.name ?? '?'}
                  </span>
                  {c.availability_status === 'available' && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#4ade80',
                        marginTop: -2,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            {extra > 0 && (
              <p style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
                +{extra} more
              </p>
            )}
            {isCompanion && bridgeStatus === 'idle' && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <button
                  onClick={bridge}
                  disabled={loading}
                  style={{
                    fontSize: 12,
                    color: '#e8607a',
                    background: 'none',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    padding: 0,
                  }}
                >
                  Bridge yourself with this story →
                </button>
              </div>
            )}
            {isCompanion && bridgeStatus === 'pending' && (
              <p style={{ fontSize: 12, color: '#c9a96e', textAlign: 'center', marginTop: 8 }}>
                Your request is pending review.
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── StoryPageContent ─────────────────────────────────────────────────────────

export function StoryPageContent({
  rawText,
  pageImageUrls,
  currentPage,
  onPageChange,
  onTotalPages,
  storyId,
  gradient,
  fontSize = 'md',
  showBridgePage = true,
}: Props) {
  const useImages = Array.isArray(pageImageUrls) && pageImageUrls.length > 0

  // ── Container measurement ──────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [textPages, setTextPages] = useState<string[]>(() =>
    // SSR / pre-mount: char-count fallback so something renders immediately
    paginateText(rawText, FONT_SIZE_CHARS[fontSize])
  )

  // Await Playfair Display load once
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.fonts.ready.then(() => setFontsLoaded(true))
  }, [])

  // Observe container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setContainerSize((prev) =>
        prev.w === width && prev.h === height ? prev : { w: width, h: height }
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Re-paginate whenever text, font size, container, or fonts change
  useEffect(() => {
    if (useImages || !containerSize.w || !containerSize.h || !fontsLoaded) return
    const pages = computePages(rawText, fontSize, containerSize.w, containerSize.h)
    setTextPages(pages.length > 0 ? pages : [rawText])
  }, [rawText, fontSize, containerSize.w, containerSize.h, useImages, fontsLoaded])

  // Derived totals
  const contentTotal = useImages ? (pageImageUrls?.length ?? 0) : textPages.length
  const total = contentTotal + (showBridgePage ? 1 : 0)

  // Notify parent of total pages
  useEffect(() => {
    onTotalPages?.(total)
  }, [total]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Page navigation ────────────────────────────────────────────────────────
  const [displayPage, setDisplayPage] = useState(currentPage)
  const [dir, setDir] = useState(0)
  const prevPropPage = useRef(currentPage)

  // Sync external reset (e.g. card becomes inactive → parent resets to 0)
  useEffect(() => {
    if (currentPage === prevPropPage.current) return
    prevPropPage.current = currentPage
    setDir(0)
    setDisplayPage(currentPage)
  }, [currentPage])

  // Clamp if total pages shrinks (e.g. font size increased → fewer pages)
  useEffect(() => {
    if (displayPage >= total) {
      const clamped = Math.max(0, total - 1)
      prevPropPage.current = clamped
      setDisplayPage(clamped)
      onPageChange(clamped)
    }
  }, [total]) // eslint-disable-line react-hooks/exhaustive-deps

  function goTo(target: number) {
    if (target < 0 || target >= total || target === displayPage) return
    const d = target > displayPage ? 1 : -1
    prevPropPage.current = target
    setDir(d)
    setDisplayPage(target)
    onPageChange(target)
  }

  // ── Swipe detection ────────────────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

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
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) * 0.8) return
    e.stopPropagation()
    if (dx < 0) goTo(displayPage + 1)
    else goTo(displayPage - 1)
  }

  // ── Render page content ────────────────────────────────────────────────────
  function renderContent(idx: number) {
    if (showBridgePage && idx === contentTotal) {
      return <BridgePage storyId={storyId} gradient={gradient} />
    }
    if (useImages) {
      return (
        <Image
          src={pageImageUrls![idx]}
          alt=""
          fill
          style={{ objectFit: 'contain' }}
          sizes="100vw"
        />
      )
    }
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px 28px',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: FONT_SIZE_PX[fontSize],
            color: '#eeeef0',
            lineHeight: 2.0,
            letterSpacing: '0.02em',
            whiteSpace: 'pre-wrap',
            width: '100%',
            margin: 0,
          }}
        >
          {textPages[idx] ?? ''}
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#07090f',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Horizontal slide ──────────────────────────────────────────────── */}
      <AnimatePresence custom={dir}>
        <motion.div
          key={displayPage}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {renderContent(displayPage)}
        </motion.div>
      </AnimatePresence>

      {/* ── Tap zones: 15% edges ──────────────────────────────────────────── */}
      {displayPage > 0 && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            goTo(displayPage - 1)
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '15%',
            height: '100%',
            zIndex: 10,
            cursor: 'pointer',
          }}
        />
      )}
      {displayPage < total - 1 && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            goTo(displayPage + 1)
          }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '15%',
            height: '100%',
            zIndex: 10,
            cursor: 'pointer',
          }}
        />
      )}

      {/* ── Desktop arrows ─────────────────────────────────────────────────── */}
      {displayPage > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            goTo(displayPage - 1)
          }}
          className="absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center rounded-full transition-opacity duration-200"
          style={{
            left: 8,
            width: 36,
            height: 36,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.5)',
            border: 'none',
            cursor: 'pointer',
            opacity: 0.15,
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.opacity = '0.5'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.opacity = '0.15'
          }}
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {displayPage < total - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            goTo(displayPage + 1)
          }}
          className="absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center rounded-full transition-opacity duration-200"
          style={{
            right: 8,
            width: 36,
            height: 36,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.5)',
            border: 'none',
            cursor: 'pointer',
            opacity: 0.15,
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.opacity = '0.5'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.opacity = '0.15'
          }}
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  )
}
