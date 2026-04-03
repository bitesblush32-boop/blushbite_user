'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { fullStories } from '@/lib/fullStories'

const StoryReel     = dynamic(() => import('@/components/ui/StoryReel'),    { ssr: false })
const StoryComments = dynamic(() => import('@/components/ui/StoryComments'), { ssr: false })

interface Props {
  params: { id: string }
}

export default function StoryByIdPage({ params }: Props) {
  const startIndex = Math.max(
    0,
    fullStories.findIndex((s) => s.id === params.id)
  )

  // Reorder so the target story is first; the rest follow in order
  const ordered = [
    ...fullStories.slice(startIndex),
    ...fullStories.slice(0, startIndex),
  ]

  const [activeIndex, setActiveIndex] = useState(0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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
          {ordered.map((story, index) => (
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

      <StoryComments
        story={ordered[activeIndex]}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </>
  )
}
