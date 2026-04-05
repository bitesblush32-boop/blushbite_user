'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { paginateText } from '@/lib/paginateText'
import { StoryPageContent } from './StoryPageContent'
import { ActionPill } from './ActionPill'
import { useLikeMutation } from '@/hooks/useLikeMutation'
import type { Story } from '@/hooks/useInfiniteConfessions'

// Story type doesn't yet include title — extend locally for forward-compat
type StoryWithTitle = Story & { title?: string }

// ─── Gradient map ─────────────────────────────────────────────────────────────

const GRADIENT_MAP: Record<string, string> = {
  Romantic:    'linear-gradient(160deg, #1a0e20 0%, #07090f 50%, #0a0a14 100%)',
  Intense:     'linear-gradient(160deg, #0d0a14 0%, #07090f 50%, #100810 100%)',
  Confessions: 'linear-gradient(160deg, #0e0d18 0%, #07090f 50%, #0a0810 100%)',
  default:     'linear-gradient(160deg, #0d1117 0%, #07090f 60%, #0d0a12 100%)',
}

function getGradient(categoryName: string, moodTags: string[]): string {
  return (
    GRADIENT_MAP[categoryName] ??
    GRADIENT_MAP[moodTags[0] ?? ''] ??
    GRADIENT_MAP['default']
  )
}

// ─── ConfessionCard ───────────────────────────────────────────────────────────

interface Props {
  story:    Story
  isActive: boolean
}

const ConfessionCard = memo(function ConfessionCard({ story: _story, isActive }: Props) {
  const story    = _story as StoryWithTitle
  const [currentPage, setCurrentPage] = useState(0)
  const pages    = paginateText(story.rawBody ?? story.body)
  const gradient = getGradient(story.categoryName, story.moodTags)

  // Double-tap to like
  const lastTapRef    = useRef<number>(0)
  const touchFiredRef = useRef(false)           // ghost-click guard
  const [heartVisible, setHeartVisible] = useState(false)
  const [heartPos, setHeartPos]         = useState({ x: 0, y: 0 })

  const isLiked      = story.userHasLiked
  const likeMutation = useLikeMutation()

  function handleTap(e: React.TouchEvent | React.MouseEvent) {
    // Ghost-click guard: a single physical tap fires onTouchEnd first, then a
    // browser-synthesised onClick ~300ms later. Without this guard the synthesised
    // click lands inside the 300ms window and mis-fires as a double-tap.
    if ('touches' in e) {
      touchFiredRef.current = true
    } else {
      if (touchFiredRef.current) {
        touchFiredRef.current = false
        return // swallow ghost click
      }
    }

    const now   = Date.now()
    const delta = now - lastTapRef.current
    lastTapRef.current = now

    if (delta < 300 && delta > 0) {
      // Always show heart overlay on double-tap (Instagram behaviour)
      const rect    = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const clientX = 'touches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX
      const clientY = 'touches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY
      setHeartPos({ x: clientX - rect.left, y: clientY - rect.top })
      setHeartVisible(true)
      setTimeout(() => setHeartVisible(false), 900)

      // Only fire like when not already liked — no toggle-off
      if (!isLiked) {
        likeMutation.mutate({ storyId: story.id, currentlyLiked: false })
      }
    }
  }

  // Reset page when card scrolls off-screen
  useEffect(() => {
    if (!isActive) setCurrentPage(0)
  }, [isActive])

  const displayMoodTags = story.moodTags.slice(0, 2)
  const hasHeader       = !!(story.title || story.categoryName || displayMoodTags.length > 0)

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        width:         '100%',
        height:        '100%',
        position:      'relative',
        overflow:      'hidden',
        background:    '#07090f',
      }}
    >
      {/* ── Background layers (z-0 → z-[5], pointer-events-none) ─────────── */}
      <div className="absolute inset-0 z-0" style={{ background: gradient }} />

      <div
        className="fixed inset-0 pointer-events-none z-[5] opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none z-[4]"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 80%, rgba(232,96,122,0.04) 0%, transparent 70%)',
        }}
      />

      {/* ── HEADER zone ──────────────────────────────────────────────────── */}
      {hasHeader && (
        <div
          style={{
            flexShrink:    0,
            zIndex:        20,
            paddingTop:    'max(12px, env(safe-area-inset-top))',
            paddingLeft:   16,
            paddingRight:  16,
            paddingBottom: 10,
            background:    'linear-gradient(to bottom, rgba(7,9,15,0.85) 0%, transparent 100%)',
          }}
        >
          {/* Title */}
          {story.title && (
            <p
              style={{
                fontFamily:   "'Playfair Display', serif",
                fontSize:     20,
                color:        '#eeeef0',
                fontStyle:    'italic',
                whiteSpace:   'nowrap',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                margin:       0,
                lineHeight:   1.3,
              }}
            >
              {story.title}
            </p>
          )}

          {/* Chips */}
          {(story.categoryName || displayMoodTags.length > 0) && (
            <div
              style={{
                display:    'flex',
                flexWrap:   'wrap',
                gap:        5,
                marginTop:  story.title ? 6 : 0,
              }}
            >
              {story.categoryName && (
                <span
                  style={{
                    fontSize:     10,
                    color:        '#e8607a',
                    background:   'rgba(232,96,122,0.12)',
                    border:       '1px solid rgba(232,96,122,0.3)',
                    padding:      '3px 8px',
                    borderRadius: 999,
                  }}
                >
                  {story.categoryName}
                </span>
              )}
              {displayMoodTags.map(t => (
                <span
                  key={t}
                  style={{
                    fontSize:     10,
                    color:        '#6b7280',
                    background:   'rgba(255,255,255,0.04)',
                    border:       '1px solid #1c2333',
                    padding:      '3px 8px',
                    borderRadius: 999,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BODY zone (double-tap target) ────────────────────────────────── */}
      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden', zIndex: 10 }}
        onTouchEnd={handleTap}
        onClick={handleTap}
      >
        <StoryPageContent
          pages={pages}
          pageImageUrls={story.pageImageUrls}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />

        {/* Double-tap heart overlay */}
        <AnimatePresence>
          {heartVisible && (
            <motion.div
              key="double-tap-heart"
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: [0, 1.4, 1.1], opacity: [0.9, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              style={{
                position:       'absolute',
                left:           heartPos.x - 40,
                top:            heartPos.y - 40,
                width:          80,
                height:         80,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                pointerEvents:  'none',
                zIndex:         25,
              }}
            >
              <Heart
                size={72}
                fill="#e8607a"
                color="#e8607a"
                strokeWidth={0}
                style={{ filter: 'drop-shadow(0 0 16px rgba(232,96,122,0.7))' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER zone ──────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink:     0,
          zIndex:         20,
          paddingBottom:  'max(12px, env(safe-area-inset-bottom))',
          paddingLeft:    16,
          paddingRight:   16,
          paddingTop:     10,
          background:     'linear-gradient(to top, rgba(7,9,15,0.85) 0%, transparent 100%)',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            10,
        }}
      >
        {/* Row 1 — Instagram-style pill dots (only when multi-page) */}
        {pages.length > 1 && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {pages.map((_, i) => (
              <div
                key={i}
                style={{
                  width:        i === currentPage ? 18 : 5,
                  height:       5,
                  borderRadius: 999,
                  background:   i === currentPage ? '#e8607a' : 'rgba(255,255,255,0.2)',
                  transition:   'width 0.2s ease, background 0.2s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Row 2 — Horizontal action bar */}
        <ActionPill
          storyId={story.id}
          likeCount={story.likeCount}
          saveCount={story.saveCount}
          commentCount={story.commentCount}
          userHasLiked={story.userHasLiked}
          userHasSaved={story.userHasSaved}
          layout="horizontal"
        />

        {/* Row 3 — Author alias */}
        <span style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
          {story.isAnonymous || !story.authorAlias ? 'anonymous' : story.authorAlias}
        </span>
      </div>
    </div>
  )
})

export { ConfessionCard }
