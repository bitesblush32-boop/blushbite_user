'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { paginateText } from '@/lib/paginateText'
import { StoryPageContent } from './StoryPageContent'
import { ActionPill } from './ActionPill'
import { StoryMeta } from './StoryMeta'
import type { Story } from '@/hooks/useInfiniteConfessions'

// ─── Gradient map ─────────────────────────────────────────────────────────────

const GRADIENT_MAP: Record<string, string> = {
  Romantic:     'linear-gradient(160deg, #1a0e20 0%, #07090f 50%, #0a0a14 100%)',
  Intense:      'linear-gradient(160deg, #0d0a14 0%, #07090f 50%, #100810 100%)',
  Confessions:  'linear-gradient(160deg, #0e0d18 0%, #07090f 50%, #0a0810 100%)',
  default:      'linear-gradient(160deg, #0d1117 0%, #07090f 60%, #0d0a12 100%)',
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
  const gradient = getGradient(story.categoryName, story.moodTags)

  // Double-tap to like
  const lastTapRef                    = useRef<number>(0)
  const [heartVisible, setHeartVisible] = useState(false)
  const [heartPos, setHeartPos]         = useState({ x: 0, y: 0 })

  const isLiked = story.userHasLiked

  function onLike() {
    fetch(`/api/confessions/${story.id}/like`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
  }

  function handleTap(e: React.TouchEvent | React.MouseEvent) {
    const now   = Date.now()
    const delta = now - lastTapRef.current
    lastTapRef.current = now
    if (delta < 300 && delta > 0) {
      if (!isLiked) onLike()
      const rect    = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const clientX = 'touches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX
      const clientY = 'touches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY
      setHeartPos({ x: clientX - rect.left, y: clientY - rect.top })
      setHeartVisible(true)
      setTimeout(() => setHeartVisible(false), 900)
    }
  }

  // Reset page when card scrolls off-screen
  useEffect(() => {
    if (!isActive) setCurrentPage(0)
  }, [isActive])

  return (
    <div
      style={{
        position:   'relative',
        width:      '100%',
        height:     '100%',
        background: '#07090f',
        overflow:   'hidden',
      }}
    >
      {/* Background gradient layer */}
      <div className="absolute inset-0 z-0" style={{ background: gradient }} />

      {/* Noise texture (pointer-events-none, z-[5]) */}
      <div
        className="fixed inset-0 pointer-events-none z-[5] opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient rose glow — bottom-weighted */}
      <div
        className="absolute inset-0 pointer-events-none z-[4]"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 80%, rgba(232,96,122,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Story text content — double-tap target */}
      <div
        className="absolute inset-0 z-[10]"
        onTouchEnd={handleTap}
        onClick={handleTap}
      >
        <StoryPageContent
          pages={pages}
          pageImageUrls={story.pageImageUrls}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Double-tap heart animation */}
      <AnimatePresence>
        {heartVisible && (
          <motion.div
            key="double-tap-heart"
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: [0, 1.4, 1.1], opacity: [0.9, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: heartPos.x - 40,
              top: heartPos.y - 40,
              width: 80, height: 80,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 25,
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

      {/* Bottom gradient scrim */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-[15]"
        style={{
          height:     '40%',
          background: 'linear-gradient(transparent, rgba(7,9,15,0.88))',
        }}
      />

      {/* Author + tags meta */}
      <StoryMeta
        authorAlias={story.authorAlias}
        isAnonymous={story.isAnonymous}
        moodTags={story.moodTags}
        categoryName={story.categoryName}
        body={story.body}
        rawBody={story.rawBody}
        totalPages={pages.length}
      />

      {/* Action buttons */}
      <ActionPill
        storyId={story.id}
        likeCount={story.likeCount}
        saveCount={story.saveCount}
        commentCount={story.commentCount}
        userHasLiked={story.userHasLiked}
        userHasSaved={story.userHasSaved}
      />
    </div>
  )
})

export { ConfessionCard }
