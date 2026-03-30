'use client'

import React from 'react'
import type { Audio } from '@/lib/types'
import { usePlayerStore } from '@/store/playerStore'

// Wave bar heights — 18 values cycling the pattern from CLAUDE.md
const BAR_HEIGHTS = [14, 20, 26, 20, 32, 20, 14, 26, 20, 32, 14, 26, 20, 14, 32, 20, 26, 14]

interface Props {
  audio: Audio
  style?: React.CSSProperties
}

function AudioCard({ audio, style }: Props) {
  const play = usePlayerStore((s) => s.play)

  return (
    <div
      className="w-[240px] flex-shrink-0 bg-[#111620] border border-[#1c2333] rounded-[14px] overflow-hidden cursor-pointer relative group transition-all duration-[250ms] hover:-translate-y-1"
      style={style}
      onClick={() =>
        play({
          id: audio.id,
          title: audio.title,
          meta: `${audio.voice} · ${audio.duration} · ${audio.vibe}`,
        })
      }
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Media */}
      <div
        className="h-[100px] flex items-center justify-center relative overflow-hidden"
        style={{ background: audio.gradient }}
      >
        {/* Waveform bars — CSS animation on compositor thread */}
        <div className="flex items-center gap-[3px] h-[40px] px-5">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: h,
                borderRadius: 2,
                background: '#e8607a',
                opacity: 0.6,
                animation: `wave 1.2s ease-in-out ${(i * 0.07).toFixed(2)}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Play overlay — reveals on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white"
            style={{ background: '#e8607a', boxShadow: '0 0 24px rgba(232,96,122,0.5)' }}
          >
            ▶
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-[14px]">
        <div className="text-[14px] font-medium text-[#eeeef0] mb-[4px]">{audio.title}</div>
        <div className="text-[11.5px] text-[#6b7280] mb-[10px]">
          {audio.voice} · {audio.duration} · {audio.vibe}
        </div>
        <div className="flex flex-wrap gap-[6px]">
          {audio.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo(AudioCard)
