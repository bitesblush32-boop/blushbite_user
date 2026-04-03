'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Volume2, VolumeX, MessageCircle, Bookmark,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { StoryFull } from '@/lib/types'

interface Props {
  story: StoryFull
  onCommentOpen: () => void
}

function StoryReel({ story, onCommentOpen }: Props) {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageDir, setPageDir]     = useState(1)
  const [liked, setLiked]         = useState(false)
  const [saved, setSaved]         = useState(false)
  const [audioOn, setAudioOn]     = useState(false)
  const [likeCount, setLikeCount] = useState(story.likeCount)

  const containerRef  = useRef<HTMLDivElement>(null)
  const touchStartX   = useRef(0)
  const touchStartY   = useRef(0)
  const isDragging    = useRef(false)
  const totalPages    = story.pages.length

  const goToPage = useCallback(
    (next: number) => {
      if (next < 0 || next >= totalPages) return
      setPageDir(next > pageIndex ? 1 : -1)
      setPageIndex(next)
    },
    [pageIndex, totalPages]
  )

  const handleLike = () =>
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1))
      return !prev
    })

  // Non-passive listener so we can preventDefault on horizontal swipe
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (e: TouchEvent) => {
      if (!isDragging.current) return
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current
      if (Math.abs(dx) > Math.abs(dy)) e.preventDefault()
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current  = true
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
      dx < 0 ? goToPage(pageIndex + 1) : goToPage(pageIndex - 1)
    }
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToPage(pageIndex + 1)
      if (e.key === 'ArrowLeft')  goToPage(pageIndex - 1)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [goToPage, pageIndex])

  const initials = story.authorAlias.replace('@', '').slice(0, 2).toUpperCase()

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background gradient */}
      <div className="absolute inset-0" style={{ background: story.gradient }} />
      {/* Uniform dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(7,9,15,0.80)' }} />

      {/* ── Page progress bar (full width, above card) ─────────────── */}
      <div className="absolute top-0 left-0 right-0 flex gap-[3px] px-4 pt-[10px] z-20">
        {story.pages.map((_, i) => (
          <div key={i} className="flex-1 h-[2px] rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                background: '#e8607a',
                width: i <= pageIndex ? '100%' : '0%',
                opacity: i < pageIndex ? 0.45 : i === pageIndex ? 1 : 0,
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Main layout: [post card] + [action bar] ─────────────────── */}
      <div className="absolute inset-0 flex justify-center px-4 pt-7 pb-4">
        <div className="flex items-stretch gap-3 w-full max-w-[580px]">

          {/* ══ Post card ═══════════════════════════════════════════════ */}
          <div
            className="flex-1 min-w-0 flex flex-col rounded-[16px] overflow-hidden"
            style={{
              background: 'rgba(13,17,23,0.84)',
              border: '1px solid rgba(28,35,51,0.85)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Top accent line */}
            <div
              className="h-[2px] flex-shrink-0"
              style={{ background: 'linear-gradient(90deg,transparent,#e8607a,transparent)' }}
            />

            {/* ── Author bar ──────────────────────────────────────────── */}
            <div className="px-4 pt-[13px] pb-[11px] flex-shrink-0">

              {/* Row 1: avatar · name/time · type chip */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-[10px] min-w-0">
                  <div
                    className="w-[38px] h-[38px] rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#e8607a,#9b5fe0)' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-[#eeeef0] truncate leading-[1.2]">
                      {story.authorAlias}
                    </div>
                    <div className="text-[10.5px] text-[#6b7280] leading-[1.2] mt-[5px]">
                      {story.postedAt} · {story.duration} read
                    </div>
                  </div>
                </div>
                <span
                  className="text-[10px] font-medium tracking-[0.06em] uppercase text-[#e8607a] px-[9px] py-[4px] rounded-full flex-shrink-0"
                  style={{ background: 'rgba(232,96,122,0.12)', border: '1px solid rgba(232,96,122,0.3)' }}
                >
                  {story.type}
                </span>
              </div>

              {/* Row 2: mood tags — full width, left aligned */}
              <div className="flex gap-[5px] flex-wrap mt-[9px]">
                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-[8px] py-[2px] rounded-full border border-[#1c2333] text-[#6b7280]"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px flex-shrink-0 mx-4" style={{ background: 'rgba(28,35,51,0.9)' }} />

            {/* Story title */}
            <div
              className="px-4 pt-[14px] pb-[10px] text-[19px] text-[#eeeef0] leading-[1.3] flex-shrink-0"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {story.title}
            </div>

            {/* ── Page text — fixed height, no scroll (slide feel) ──── */}
            <div className="flex-1 relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={pageIndex}
                  initial={{ opacity: 0, x: pageDir * 44 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -pageDir * 44 }}
                  transition={{ duration: 0.27, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 overflow-hidden px-4 pb-3"
                >
                  {story.pages[pageIndex].split('\n\n').map((para, i) => (
                    <p
                      key={i}
                      className="mb-[13px] last:mb-0"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '13.5px',
                        color: '#c4c8d0',
                        lineHeight: '1.82',
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Page navigation ──────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-4 py-[10px] flex-shrink-0"
              style={{ borderTop: '1px solid rgba(28,35,51,0.7)' }}
            >
              <button
                onClick={() => goToPage(pageIndex - 1)}
                disabled={pageIndex === 0}
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: pageIndex > 0 ? 'rgba(255,255,255,0.07)' : 'transparent',
                  opacity: pageIndex > 0 ? 1 : 0.22,
                }}
              >
                <ChevronLeft size={15} color="#eeeef0" />
              </button>

              <div className="flex items-center gap-[7px]">
                {story.pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === pageIndex ? '18px' : '6px',
                      height: '6px',
                      background: i === pageIndex ? '#e8607a' : 'rgba(255,255,255,0.22)',
                    }}
                  />
                ))}
                <span className="text-[10px] text-[#6b7280] ml-[4px]">
                  {pageIndex + 1}/{totalPages}
                </span>
              </div>

              <button
                onClick={() => goToPage(pageIndex + 1)}
                disabled={pageIndex === totalPages - 1}
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: pageIndex < totalPages - 1 ? 'rgba(255,255,255,0.07)' : 'transparent',
                  opacity: pageIndex < totalPages - 1 ? 1 : 0.22,
                }}
              >
                <ChevronRight size={15} color="#eeeef0" />
              </button>
            </div>
          </div>

          {/* ══ Action bar — directly right of post card ════════════════ */}
          <div className="flex flex-col justify-center gap-[16px] flex-shrink-0 items-center w-[52px]">

            {/* Like */}
            <motion.button
              onClick={handleLike}
              whileTap={{ scale: 0.86 }}
              className="flex flex-col items-center gap-[4px]"
            >
              <div
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-200"
                style={{ background: liked ? 'rgba(232,96,122,0.22)' : 'rgba(255,255,255,0.08)' }}
              >
                <Heart size={19} fill={liked ? '#e8607a' : 'none'} color={liked ? '#e8607a' : '#eeeef0'} />
              </div>
              <span className="text-[10px] text-[#eeeef0]">{likeCount.toLocaleString()}</span>
            </motion.button>

            {/* Audio — placeholder */}
            <motion.button
              onClick={() => setAudioOn((a) => !a)}
              whileTap={{ scale: 0.86 }}
              className="flex flex-col items-center gap-[4px]"
            >
              <div
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-200"
                style={{ background: audioOn ? 'rgba(232,96,122,0.22)' : 'rgba(255,255,255,0.08)' }}
              >
                {audioOn
                  ? <Volume2 size={19} color="#e8607a" />
                  : <VolumeX size={19} color="#eeeef0" />}
              </div>
            </motion.button>

            {/* Comments */}
            <motion.button
              onClick={onCommentOpen}
              whileTap={{ scale: 0.86 }}
              className="flex flex-col items-center gap-[4px]"
            >
              <div
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/[0.12]"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <MessageCircle size={19} color="#eeeef0" />
              </div>
              <span className="text-[10px] text-[#eeeef0]">{story.commentCount.toLocaleString()}</span>
            </motion.button>

            {/* Save */}
            <motion.button
              onClick={() => setSaved((s) => !s)}
              whileTap={{ scale: 0.86 }}
              className="flex flex-col items-center gap-[4px]"
            >
              <div
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-200"
                style={{ background: saved ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.08)' }}
              >
                <Bookmark size={19} fill={saved ? '#c9a96e' : 'none'} color={saved ? '#c9a96e' : '#eeeef0'} />
              </div>
              <span className="text-[10px] text-[#eeeef0]">{story.saveCount.toLocaleString()}</span>
            </motion.button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default React.memo(StoryReel)
