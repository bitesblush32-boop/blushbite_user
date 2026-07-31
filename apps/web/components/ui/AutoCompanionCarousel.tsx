'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AutoCompanionCarouselProps {
  children: React.ReactNode[]
  autoPlayInterval?: number // default 2500ms
}

export default function AutoCompanionCarousel({
  children,
  autoPlayInterval = 2500,
}: AutoCompanionCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const updateScrollState = useCallback(() => {
    if (!containerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)

    const itemWidth = 210
    const index = Math.round(scrollLeft / itemWidth)
    setActiveIndex(Math.min(Math.max(0, index), children.length - 1))
  }, [children.length])

  // Scroll next slide function
  const scrollNext = useCallback(() => {
    if (!containerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
    const itemWidth = 210
    const nextScroll = scrollLeft + itemWidth * 2

    if (scrollLeft + clientWidth >= scrollWidth - 10) {
      // Loop back to start smoothly
      containerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    } else {
      containerRef.current.scrollTo({ left: nextScroll, behavior: 'smooth' })
    }
  }, [])

  // Scroll prev slide function
  const scrollPrev = useCallback(() => {
    if (!containerRef.current) return
    const { scrollLeft } = containerRef.current
    const itemWidth = 210
    const prevScroll = scrollLeft - itemWidth * 2

    containerRef.current.scrollTo({ left: Math.max(0, prevScroll), behavior: 'smooth' })
  }, [])

  // Auto-scroll effect
  useEffect(() => {
    if (isHovered || children.length <= 1) return

    const timer = setInterval(() => {
      scrollNext()
    }, autoPlayInterval)

    return () => clearInterval(timer)
  }, [isHovered, autoPlayInterval, scrollNext, children.length])

  // Update scroll state on manual scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    el.addEventListener('scroll', updateScrollState, { passive: true })
    updateScrollState()
    return () => el.removeEventListener('scroll', updateScrollState)
  }, [updateScrollState])

  const scrollToDot = (index: number) => {
    if (!containerRef.current) return
    const itemWidth = 210
    containerRef.current.scrollTo({ left: index * itemWidth, behavior: 'smooth' })
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Controls Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Active status indicator badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#111620] border border-[#1c2333] text-[11px] text-[#9ca3af]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isHovered ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span>{isHovered ? 'Paused' : 'Live Carousel'}</span>
          </div>
        </div>

        {/* Arrow buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canScrollLeft}
            aria-label="Previous companions"
            className={`p-2 rounded-full border transition-all ${
              canScrollLeft
                ? 'bg-[#111620] border-[#1c2333] text-[#eeeef0] hover:border-[#e8607a]/50 hover:bg-[#192030] hover:text-[#e8607a]'
                : 'bg-[#0b0e14] border-[#1c2333]/50 text-[#4b5563] cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            disabled={!canScrollRight}
            aria-label="Next companions"
            className={`p-2 rounded-full border transition-all ${
              canScrollRight
                ? 'bg-[#111620] border-[#1c2333] text-[#eeeef0] hover:border-[#e8607a]/50 hover:bg-[#192030] hover:text-[#e8607a]'
                : 'bg-[#0b0e14] border-[#1c2333]/50 text-[#4b5563] cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>

      {/* Pagination Dot Indicators */}
      {children.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {children.slice(0, Math.min(children.length, 10)).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToDot(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                Math.floor(activeIndex / 2) === Math.floor(idx / 2)
                  ? 'w-6 bg-[#e8607a] shadow-[0_0_8px_rgba(232,96,122,0.6)]'
                  : 'w-1.5 bg-[#1c2333] hover:bg-[#6b7280]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
