'use client'

// SEED: To test this feed, manually INSERT into the stories table:
//   author_type = 'admin', is_published = true, moderation_status = 'approved'
//   published_at = NOW()
//   body = JSON.stringify({ raw: '...', pages: [], categories: ['Romance'] })
// No admin upload UI in Phase 1.

import { useRef, useState, useCallback, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useInfiniteStories } from '@/hooks/useInfiniteStories'
import { useViewTracking } from '@/hooks/useViewTracking'
import { useUIStore } from '@/store/uiStore'
import { StoryFeedCard } from '@/components/ui/StoryFeedCard'
import { CommentsSheet } from '@/components/ui/CommentsSheet'

export function StoriesFeed() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const { activeStoryId, closeComments } = useUIStore()
  const { stories, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteStories()
  const { observe } = useViewTracking(2000)

  const itemObservers = useRef<Map<number, IntersectionObserver>>(new Map())

  // Hide Header and BottomNav while feed is mounted
  useEffect(() => {
    document.body.classList.add('feed-mode')
    return () => document.body.classList.remove('feed-mode')
  }, [])

  // Cleanup observers on unmount
  useEffect(() => {
    return () => {
      Array.from(itemObservers.current.values()).forEach(o => o.disconnect())
    }
  }, [])

  const setItemRef = useCallback(
    (index: number, storyId: string, node: HTMLDivElement | null) => {
      const prev = itemObservers.current.get(index)
      if (prev) { prev.disconnect(); itemObservers.current.delete(index) }
      if (!node) return

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            setActiveIndex(index)
            if (
              index >= stories.length - 3 &&
              hasNextPage &&
              !isFetchingNextPage
            ) {
              fetchNextPage()
            }
          }
        },
        { threshold: 0.5 }
      )
      observer.observe(node)
      itemObservers.current.set(index, observer)

      observe(storyId, node)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stories.length, hasNextPage, isFetchingNextPage, fetchNextPage, observe]
  )

  // ── Loading state ─────────────────────────────────────────────────────────
  if (status === 'pending') {
    return (
      <div
        className="fixed inset-0 z-10"
        style={{ background: '#07090f', overflow: 'hidden' }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="animate-pulse"
            style={{ height: '100dvh', background: '#0d1117' }}
          />
        ))}
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div
        className="fixed inset-0 z-10 flex items-center justify-center"
        style={{ background: '#07090f' }}
      >
        <p style={{ fontSize: 13, color: '#e8607a' }}>
          Something went wrong. Please try again.
        </p>
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (stories.length === 0) {
    return (
      <div
        className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-3"
        style={{ background: '#07090f' }}
      >
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize:   18,
            color:      '#eeeef0',
          }}
        >
          Nothing here yet.
        </p>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Check back soon — new stories arrive weekly.
        </p>
      </div>
    )
  }

  // ── Feed ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={containerRef}
        className="fixed top-0 left-0 right-0 z-10"
        style={{
          bottom:              64,
          overflowY:           'scroll',
          scrollSnapType:      'y mandatory',
          overscrollBehaviorY: 'contain',
          background:          '#07090f',
        }}
      >
        {stories.map((story, index) => (
          <div
            key={story.id}
            ref={(node) => setItemRef(index, story.id, node)}
            style={{
              height:          'calc(100dvh - 64px)',
              scrollSnapAlign: 'start',
              scrollSnapStop:  'always',
              position:        'relative',
              flexShrink:      0,
            }}
          >
            <StoryFeedCard story={story} isActive={index === activeIndex} />
          </div>
        ))}

        {isFetchingNextPage && (
          <div
            className="flex items-center justify-center py-6"
            style={{ height: 64 }}
          >
            <Loader2 size={28} className="animate-spin" style={{ color: '#e8607a' }} />
          </div>
        )}

        {!hasNextPage && stories.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <p style={{ fontSize: 12, color: '#4b5563', fontStyle: 'italic' }}>
              You&apos;ve seen everything for now.
            </p>
          </div>
        )}
      </div>

      <CommentsSheet storyId={activeStoryId} onClose={closeComments} />
    </>
  )
}
