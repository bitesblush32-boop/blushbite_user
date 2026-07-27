'use client'

import React, { useState } from 'react'

export interface PlatformVideo {
  id: string
  url: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  profileId: string
  companionName: string | null
  city: string | null
  companionPhoto: string | null
}

function fmtDuration(sec: number | null): string {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

const VideoCard = React.memo(function VideoCard({ video }: { video: PlatformVideo }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="w-[220px] bg-[#111620] border border-[#1c2333] rounded-[14px] overflow-hidden cursor-pointer"
      style={{
        transition: 'transform 250ms ease, box-shadow 250ms ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(232,96,122,0.2)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => (window.location.href = '/companions/' + video.profileId)}
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden"
        style={{ height: 200, background: 'linear-gradient(135deg,#1a0e20,#2a1540,#1a1220)' }}
      >
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center"
              style={{ background: 'rgba(232,96,122,0.15)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <polygon points="5,3 15,9 5,15" fill="rgba(232,96,122,0.5)" />
              </svg>
            </div>
          </div>
        )}

        {/* Play overlay on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: 'rgba(7,9,15,0.45)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 200ms ease',
          }}
        >
          <div
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center"
            style={{ background: 'rgba(232,96,122,0.85)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <polygon points="4,2 14,8 4,14" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        {video.durationSeconds != null && (
          <span
            className="absolute bottom-2 right-2 text-[10px] text-[#eeeef0] px-[6px] py-[2px] rounded-[4px]"
            style={{ background: 'rgba(7,9,15,0.8)' }}
          >
            {fmtDuration(video.durationSeconds)}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="p-[12px]">
        <p className="text-[13px] font-medium text-[#eeeef0] truncate mb-[2px]">
          {video.companionName ?? 'Companion'}
        </p>
        {video.city && <p className="text-[11px] text-[#6b7280]">{video.city}</p>}
      </div>
    </div>
  )
})

export default VideoCard
