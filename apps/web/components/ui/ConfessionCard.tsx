'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { paginateText } from '@/lib/paginateText'
import { StoryPageContent } from './StoryPageContent'
import { ActionPill } from './ActionPill'
import { useLikeMutation } from '@/hooks/useLikeMutation'
import type { Story } from '@/hooks/useInfiniteConfessions'

// ─── Design-system tokens ─────────────────────────────────────────────────────
// --bg: #07090f  --card: #111620  --card2: #161d2a
// --accent: #e8607a  --text: #eeeef0  --muted: #6b7280  --border: #1c2333

// ─── Category → mood gradient (body zone background) ─────────────────────────
// 180° vertical keeps the colour flowing top→bottom through all three zones.
// Middle anchors at #07090f so the image's #07090f base matches seamlessly.

const GRADIENT_MAP: Record<string, string> = {
  Romantic:     'linear-gradient(180deg, #1c0c1e 0%, #07090f 35%, #07090f 65%, #120818 100%)',
  Intense:      'linear-gradient(180deg, #0e0b1e 0%, #07090f 35%, #07090f 65%, #10091a 100%)',
  Confessions:  'linear-gradient(180deg, #11101e 0%, #07090f 35%, #07090f 65%, #0d0a1a 100%)',
  'Dark Romance':'linear-gradient(180deg, #1a0c1c 0%, #07090f 35%, #07090f 65%, #130818 100%)',
  BDSM:         'linear-gradient(180deg, #0e0b1e 0%, #07090f 35%, #07090f 65%, #100918 100%)',
  default:      'linear-gradient(180deg, #10101e 0%, #07090f 35%, #07090f 65%, #0d0b1c 100%)',
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

const ConfessionCard = memo(function ConfessionCard({ story, isActive }: Props) {
  const [currentPage, setCurrentPage] = useState(0)
  const pages    = paginateText(story.rawBody ?? story.body)
  
  // Debug: Check what data is actually available
  const hasImages = Array.isArray(story.pageImageUrls) && story.pageImageUrls.length > 0
  const totalPages = hasImages ? story.pageImageUrls.length : pages.length
  
  // useEffect(() => {
  //   console.log('📖 ConfessionCard debug:', {
  //     storyId: story.id,
  //     hasImages,
  //     imageCount: story.pageImageUrls?.length ?? 0,
  //     imageUrls: story.pageImageUrls,
  //     textPageCount: pages.length,
  //     totalPages,
  //     currentPage,
  //     isActive,
  //   })
  // }, [story.id, hasImages, totalPages, currentPage, isActive, story.pageImageUrls, pages.length])
  
  const gradient = getGradient(story.categoryName, story.moodTags)

  const lastTapRef    = useRef<number>(0)
  const touchFiredRef = useRef(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const [heartVisible, setHeartVisible] = useState(false)
  const [heartPos, setHeartPos]         = useState({ x: 0, y: 0 })

  const isLiked      = story.userHasLiked
  const likeMutation = useLikeMutation()

  function handleTap(e: React.TouchEvent | React.MouseEvent) {
    if ('touches' in e) {
      // This is a touch event — check if it was a swipe
      if (!touchStartRef.current) return
      const clientX = e.changedTouches[0]?.clientX
      const clientY = e.changedTouches[0]?.clientY
      if (!clientX || !clientY) return
      
      const dx = Math.abs(clientX - touchStartRef.current.x)
      const dy = Math.abs(clientY - touchStartRef.current.y)
      // If moved more than 30px, it's a swipe, not a tap
      if (dx > 30 || dy > 30) return
      
      // It's a tap — trigger double-tap with same logic as mouse
      const now   = Date.now()
      const delta = now - lastTapRef.current
      lastTapRef.current = now

      if (delta < 300 && delta > 0) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setHeartPos({ x: clientX - rect.left, y: clientY - rect.top })
        setHeartVisible(true)
        setTimeout(() => setHeartVisible(false), 900)
        if (!isLiked) {
          likeMutation.mutate({ storyId: story.id, currentlyLiked: false })
        }
      }
    } else {
      // Mouse click
      if (touchFiredRef.current) {
        touchFiredRef.current = false
        return
      }
      const now   = Date.now()
      const delta = now - lastTapRef.current
      lastTapRef.current = now

      if (delta < 300 && delta > 0) {
        const rect    = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const clientX = (e as React.MouseEvent).clientX
        const clientY = (e as React.MouseEvent).clientY
        setHeartPos({ x: clientX - rect.left, y: clientY - rect.top })
        setHeartVisible(true)
        setTimeout(() => setHeartVisible(false), 900)
        if (!isLiked) {
          likeMutation.mutate({ storyId: story.id, currentlyLiked: false })
        }
      }
    }
  }

  useEffect(() => {
    if (!isActive) setCurrentPage(0)
  }, [isActive])

  // Show up to 3 extra categories as secondary chips
  const secondaryChips = story.moodTags.slice(0, 3)

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
      {/* Mood gradient — covers full card so colours flow top→body→footer */}
      <div className="absolute inset-0 z-0" style={{ background: gradient }} />
      {/* Rose brand glow */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 70% 35% at 50% 90%, rgba(232,96,122,0.10) 0%, transparent 70%)' }}
      />

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      {/* Solid #111620 card background — always readable regardless of body image */}
      <div
        style={{
          flexShrink:    0,
          zIndex:        20,
          paddingTop:    'max(14px, env(safe-area-inset-top))',
          paddingLeft:   16,
          paddingRight:  16,
          paddingBottom: 12,
          background:    '#111620',
          borderBottom:  '1px solid #1c2333',
        }}
      >
        {/* Rose top-accent line */}
        <div
          style={{
            position:   'absolute',
            top:        0,
            left:       0,
            right:      0,
            height:     2,
            background: 'linear-gradient(90deg, transparent, #e8607a, transparent)',
          }}
        />

        {/* Title — Playfair italic, primary text */}
        {story.title ? (
          <>
            <p
              style={{
                fontFamily:   "'Playfair Display', serif",
                fontSize:     18,
                color:        '#eeeef0',
                fontStyle:    'italic',
                margin:       0,
                lineHeight:   1.35,
                wordWrap:     'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {story.title}
            </p>
            {/* Author name below title */}
            <p
              style={{
                fontSize:   11,
                color:      '#6b7280',
                fontStyle:  'italic',
                margin:     '4px 0 0 0',
                lineHeight: 1.3,
              }}
            >
              by {story.isAnonymous || !story.authorAlias ? 'anonymous' : story.authorAlias}
            </p>
          </>
        ) : (
          // Fallback when no title: show a soft placeholder so header is never blank
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize:   16,
              color:      '#6b7280',
              fontStyle:  'italic',
              margin:     0,
              lineHeight: 1.35,
            }}
          >
            anonymous confession
          </p>
        )}

        {/* Category + mood chips */}
        {(story.categoryName || secondaryChips.length > 0) && (
          <div
            style={{
              display:   'flex',
              flexWrap:  'wrap',
              gap:       4,
              marginTop: 6,
            }}
          >
            {/* Primary category — rose chip */}
            {story.categoryName && (
              <span
                style={{
                  fontSize:     10,
                  fontWeight:   500,
                  color:        '#e8607a',
                  background:   'rgba(232,96,122,0.12)',
                  border:       '1px solid rgba(232,96,122,0.3)',
                  padding:      '3px 9px',
                  borderRadius: 999,
                }}
              >
                {story.categoryName}
              </span>
            )}

            {/* Extra categories — rose chips */}
            {secondaryChips.map(t => (
              <span
                key={t}
                style={{
                  fontSize:     10,
                  fontWeight:   500,
                  color:        '#e8607a',
                  background:   'rgba(232,96,122,0.12)',
                  border:       '1px solid rgba(232,96,122,0.3)',
                  padding:      '3px 9px',
                  borderRadius: 999,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── BODY — image fills this zone ──────────────────────────────────── */}
      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden', zIndex: 10 }}
        onTouchStart={(e) => {
          touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          }
        }}
        onTouchEnd={handleTap}
        onClick={handleTap}
      >
        <StoryPageContent
          pages={pages}
          pageImageUrls={story.pageImageUrls}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />

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

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      {/* Solid #111620 card background — mirrors the header */}
      <div
        style={{
          flexShrink:    0,
          zIndex:        20,
          paddingBottom: 6,
          paddingLeft:   16,
          paddingRight:  16,
          paddingTop:    10,
          background:    '#111620',
          borderTop:     '1px solid #1c2333',
          display:       'flex',
          flexDirection: 'column',
          gap:           8,
        }}
      >
        {/* Page progress dots — centered */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, alignItems: 'center' }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                style={{
                  width:        i === currentPage ? 18 : 5,
                  height:       5,
                  borderRadius: 999,
                  background:   i === currentPage ? '#e8607a' : '#1c2333',
                  transition:   'width 0.2s ease, background 0.2s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Like / comment / save / audio */}
        <ActionPill
          storyId={story.id}
          likeCount={story.likeCount}
          saveCount={story.saveCount}
          commentCount={story.commentCount}
          userHasLiked={story.userHasLiked}
          userHasSaved={story.userHasSaved}
          layout="horizontal"
        />

      </div>
    </div>
  )
})

export { ConfessionCard }
