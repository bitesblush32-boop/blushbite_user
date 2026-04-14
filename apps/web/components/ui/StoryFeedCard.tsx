'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Link2, Loader2 } from 'lucide-react'
import { paginateText } from '@/lib/paginateText'
import { StoryPageContent } from './StoryPageContent'
import { ActionPill } from './ActionPill'
import { useStoryLikeMutation } from '@/hooks/useStoryLikeMutation'
import { useStorySaveMutation } from '@/hooks/useStorySaveMutation'
import { useBridgeMutation } from '@/hooks/useBridgeMutation'
import type { Story } from '@/hooks/useInfiniteConfessions'

// ─── Platform-story gradient palette ──────────────────────────────────────────
const GRADIENT_MAP: Record<string, string> = {
  Romance:  'linear-gradient(180deg, #1a0c14 0%, #07090f 35%, #07090f 65%, #150810 100%)',
  Erotica:  'linear-gradient(180deg, #160a1e 0%, #07090f 35%, #07090f 65%, #120818 100%)',
  Fantasy:  'linear-gradient(180deg, #0c101e 0%, #07090f 35%, #07090f 65%, #0a0c1c 100%)',
  Thriller: 'linear-gradient(180deg, #0e0e10 0%, #07090f 35%, #07090f 65%, #0c0c10 100%)',
  Drama:    'linear-gradient(180deg, #1c100c 0%, #07090f 35%, #07090f 65%, #180c08 100%)',
  default:  'linear-gradient(180deg, #10101e 0%, #07090f 35%, #07090f 65%, #0d0b1c 100%)',
}

function getGradient(categoryName: string, moodTags: string[]): string {
  return (
    GRADIENT_MAP[categoryName] ??
    GRADIENT_MAP[moodTags[0] ?? ''] ??
    GRADIENT_MAP['default']
  )
}

// ─── StoryFeedCard ─────────────────────────────────────────────────────────────

interface Props {
  story:    Story
  isActive: boolean
}

const StoryFeedCard = memo(function StoryFeedCard({ story, isActive }: Props) {
  const [currentPage, setCurrentPage] = useState(0)
  const pages    = paginateText(story.rawBody ?? story.body)
  const gradient = getGradient(story.categoryName, story.moodTags)

  const lastTapRef    = useRef<number>(0)
  const touchFiredRef = useRef(false)
  const [heartVisible, setHeartVisible] = useState(false)
  const [heartPos, setHeartPos]         = useState({ x: 0, y: 0 })

  const isLiked      = story.userHasLiked
  const likeMutation = useStoryLikeMutation()
  const saveMutation = useStorySaveMutation()
  const { isCompanion, bridgeStatus, loading: bridgeLoading, bridge } = useBridgeMutation(story.id)

  function handleTap(e: React.TouchEvent | React.MouseEvent) {
    if ('touches' in e) {
      touchFiredRef.current = true
    } else {
      if (touchFiredRef.current) {
        touchFiredRef.current = false
        return
      }
    }
    const now   = Date.now()
    const delta = now - lastTapRef.current
    lastTapRef.current = now

    if (delta < 300 && delta > 0) {
      const rect    = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const clientX = 'touches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX
      const clientY = 'touches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY
      setHeartPos({ x: clientX - rect.left, y: clientY - rect.top })
      setHeartVisible(true)
      setTimeout(() => setHeartVisible(false), 900)
      if (!isLiked) {
        likeMutation.mutate({ storyId: story.id, currentlyLiked: false })
      }
    }
  }

  useEffect(() => {
    if (!isActive) setCurrentPage(0)
  }, [isActive])

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
      {/* Mood gradient */}
      <div className="absolute inset-0 z-0" style={{ background: gradient }} />
      {/* Rose brand glow */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse 70% 35% at 50% 90%, rgba(232,96,122,0.10) 0%, transparent 70%)' }}
      />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
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

        {story.title ? (
          <p
            style={{
              fontFamily:   "'Playfair Display', serif",
              fontSize:     18,
              color:        '#eeeef0',
              fontStyle:    'italic',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              margin:       0,
              lineHeight:   1.35,
            }}
          >
            {story.title}
          </p>
        ) : (
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
            BlushBite Stories
          </p>
        )}

        {(story.categoryName || secondaryChips.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
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
            {secondaryChips.map(t => (
              <span
                key={t}
                style={{
                  fontSize:     10,
                  color:        '#6b7280',
                  background:   'rgba(255,255,255,0.03)',
                  border:       '1px solid #1c2333',
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

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
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
          storyId={story.id}
          gradient={gradient}
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

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink:    0,
          zIndex:        20,
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
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
        {/* Page progress dots */}
        {pages.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, alignItems: 'center' }}>
            {pages.map((_, i) => (
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ActionPill
            storyId={story.id}
            likeCount={story.likeCount}
            saveCount={story.saveCount}
            commentCount={story.commentCount}
            userHasLiked={story.userHasLiked}
            userHasSaved={story.userHasSaved}
            layout="horizontal"
            onLike={() => likeMutation.mutate({ storyId: story.id, currentlyLiked: story.userHasLiked })}
            onSave={() => saveMutation.mutate({ storyId: story.id, currentlySaved: story.userHasSaved })}
          />

          {isCompanion && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={bridge}
              disabled={bridgeLoading || bridgeStatus !== 'idle'}
              style={{
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                gap:           3,
                background:    'none',
                border:        'none',
                cursor:        bridgeStatus === 'idle' ? 'pointer' : 'default',
                padding:       0,
                flexShrink:    0,
              }}
            >
              <div style={{
                width:          40,
                height:         40,
                borderRadius:   '50%',
                background:     bridgeStatus === 'approved' ? 'rgba(74,222,128,0.15)'
                              : bridgeStatus === 'pending'  ? 'rgba(201,169,110,0.15)'
                              : 'rgba(28,35,51,0.8)',
                border:         `1px solid ${
                                  bridgeStatus === 'approved' ? 'rgba(74,222,128,0.4)'
                                : bridgeStatus === 'pending'  ? 'rgba(201,169,110,0.4)'
                                : '#1c2333'}`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                transition:     'background 0.2s, border-color 0.2s',
              }}>
                {bridgeLoading
                  ? <Loader2 size={16} style={{ color: '#6b7280', animation: 'spin 1s linear infinite' }} />
                  : <Link2 size={16} style={{
                      color: bridgeStatus === 'approved' ? '#4ade80'
                           : bridgeStatus === 'pending'  ? '#c9a96e'
                           : '#6b7280',
                    }} />
                }
              </div>
              <span style={{ fontSize: 10, color: '#6b7280', lineHeight: 1 }}>
                {bridgeStatus === 'approved' ? 'Bridged'
                 : bridgeStatus === 'pending'  ? 'Pending'
                 : bridgeStatus === 'rejected' ? 'Declined'
                 : 'Bridge'}
              </span>
            </motion.button>
          )}
        </div>

        {/* Author label — companion alias or platform fallback */}
        <span style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
          {story.isAnonymous || !story.authorAlias
            ? 'BlushBite Stories'
            : story.authorAlias}
        </span>
      </div>
    </div>
  )
})

export { StoryFeedCard }
