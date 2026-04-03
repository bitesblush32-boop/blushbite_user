'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { fullStories } from '@/lib/fullStories'

const StoryReel     = dynamic(() => import('@/components/ui/StoryReel'),    { ssr: false })
const StoryComments = dynamic(() => import('@/components/ui/StoryComments'), { ssr: false })

export default function StoriesPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Track which reel is currently visible via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const i = Number(entry.target.getAttribute('data-index'))
            setActiveIndex(i)
          }
        })
      },
      { root: container, threshold: 0.6 }
    )

    const slides = container.querySelectorAll('[data-story-slide]')
    slides.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* ── Full-height reel container between header and mini-player ── */}
      <div
        className="fixed left-0 right-0 z-[50]"
        style={{ top: 'var(--header-h, 75px)', bottom: 'var(--player-h, 68px)' }}
      >
        <div
          ref={scrollRef}
          className="w-full h-full"
          style={{
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {fullStories.map((story, index) => (
            <div
              key={story.id}
              data-story-slide
              data-index={index}
              className="w-full h-full flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <StoryReel
                story={story}
                onCommentOpen={() => {
                  setActiveIndex(index)
                  setCommentsOpen(true)
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Comments panel ─────────────────────────────────────────── */}
      <StoryComments
        story={fullStories[activeIndex]}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </>
  )
}
