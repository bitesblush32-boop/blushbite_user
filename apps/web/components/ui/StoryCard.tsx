'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { Story } from '@/lib/types'

interface Props {
  story: Story
  style?: React.CSSProperties
}

function StoryCard({ story, style }: Props) {
  const router = useRouter()

  return (
    <div
      className="w-[240px] flex-shrink-0 bg-[#111620] border border-[#1c2333] rounded-[14px] overflow-hidden cursor-pointer transition-all duration-[250ms] hover:-translate-y-1"
      style={style}
      onClick={() => router.push(`/stories/${story.id}`)}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Media */}
      <div className="h-[130px] relative overflow-hidden" style={{ background: story.gradient }}>
        {/* Type + duration tag */}
        <div className="absolute bottom-[10px] left-[10px] flex gap-[6px]">
          <span
            className="text-[10px] text-[#eeeef0] px-2 py-[3px] rounded-full border border-white/[0.08]"
            style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(6px)' }}
          >
            {story.type} · {story.duration}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-[14px]">
        <div className="text-[14px] font-medium text-[#eeeef0] mb-[6px] leading-[1.3]">
          {story.title}
        </div>
        <div className="text-[11.5px] text-[#6b7280] mb-[10px] leading-[1.5]">
          {story.vibe}
          <br />
          <span className="text-[10px] opacity-60">{story.handle}</span>
        </div>
        <div className="flex flex-wrap gap-[6px]">
          {story.tags.map((tag) => (
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

export default React.memo(StoryCard)
