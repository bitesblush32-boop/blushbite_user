'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePlayerStore } from '@/store/playerStore'

// TODO Phase 2: wire real audio element + progress tracking

export default function MiniPlayer() {
  const { visible, playing, title, meta, progress, pause, resume, close, setProgress } =
    usePlayerStore()

  return (
    <AnimatePresence mode="sync">
      {visible && (
        <motion.div
          initial={{ y: 68 }}
          animate={{ y: 0 }}
          exit={{ y: 68 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 h-[68px] z-[700] flex items-center px-4 md:px-10 gap-3 md:gap-5 border-t border-[#1c2333]"
          style={{
            background: 'rgba(13,17,23,0.95)',
            backdropFilter: 'blur(20px)',
            willChange: 'transform',
          }}
        >
          {/* LEFT — Controls */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            {/* Prev */}
            <button
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#6b7280] text-[12px] border-none cursor-pointer transition-colors duration-150"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = '#e8607a')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)')
              }
              aria-label="Previous"
            >
              ⟨⟨
            </button>

            {/* Play / Pause */}
            <button
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white text-[14px] border-none cursor-pointer transition-colors duration-150"
              style={{ background: '#e8607a' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = '#c4485e')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = '#e8607a')
              }
              onClick={() => (playing ? pause() : resume())}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? '⏸' : '▶'}
            </button>

            {/* Next */}
            <button
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#6b7280] text-[12px] border-none cursor-pointer transition-colors duration-150"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = '#e8607a')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)')
              }
              aria-label="Next"
            >
              ⟩⟩
            </button>
          </div>

          {/* MIDDLE — Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[#eeeef0] font-medium truncate leading-tight">{title}</p>
            <p className="text-[11px] text-[#6b7280] truncate leading-tight mt-[2px]">{meta}</p>
          </div>

          {/* RIGHT — Scrubber + Close */}
          <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
            {/* Scrubber */}
            <div
              className="hidden sm:block flex-1 w-[160px] md:w-[320px] h-[4px] rounded-full relative cursor-pointer"
              style={{ background: '#1c2333' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const pct = ((e.clientX - rect.left) / rect.width) * 100
                setProgress(Math.min(100, Math.max(0, pct)))
              }}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-100"
                style={{ width: `${progress}%`, background: '#e8607a' }}
              />
            </div>

            {/* Close */}
            <button
              className="text-[18px] text-[#6b7280] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[#eeeef0] leading-none"
              onClick={close}
              aria-label="Close player"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
