'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export interface PlatformVideo {
  id: string
  mediaType?: 'video' | 'photo'
  url: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  profileId: string
  companionName: string | null
  city: string | null
  companionPhoto?: string | null
}

function fmtDuration(sec: number | null): string {
  if (!sec) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

// If a URL points to a video file, derive the Cloudinary auto-generated jpg thumbnail.
// Cloudinary serves /video/upload/...id.mp4 → /video/upload/...id.jpg automatically.
function toImageSrc(url: string | null | undefined): string | null {
  if (!url) return null
  if (/\.(mp4|webm|mov|avi)(\?.*)?$/i.test(url)) {
    return url.replace(/\.(mp4|webm|mov|avi)(\?.*)?$/i, '.jpg')
  }
  return url
}

const VideoCard = React.memo(function VideoCard({ video }: { video: PlatformVideo }) {
  const [hovered, setHovered] = useState(false)
  const isVideo = (video.mediaType ?? 'video') === 'video'

  // Photo cards use `url` directly.
  // Video cards: derive a safe image URL — never pass a raw .mp4 to <img>.
  const imgSrc = isVideo
    ? toImageSrc(video.thumbnailUrl ?? video.companionPhoto ?? null)
    : video.url

  return (
    <Link
      href={`/companions/${video.profileId}`}
      prefetch={false}
      style={{ textDecoration: 'none', display: 'block' }}
    >
    <div
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        aspectRatio: '4 / 5',
        background: 'linear-gradient(135deg,#1a0e20,#2a1540,#1a1220)',
        border: `1px solid ${hovered ? 'rgba(232,96,122,0.35)' : '#1c2333'}`,
        cursor: 'pointer',
        transition: 'transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(232,96,122,0.2)'
          : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Media fill */}
      {imgSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top',
          }}
        />
      )}

      {/* Persistent bottom gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(7,9,15,0.96) 0%, rgba(7,9,15,0.45) 40%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Hover overlay — play button for videos, glow only for photos */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(7,9,15,0.35)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}
      >
        {isVideo && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(232,96,122,0.85)',
              boxShadow: '0 0 24px rgba(232,96,122,0.5)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <polygon points="4,2 14,8 4,14" />
            </svg>
          </div>
        )}
      </div>

      {/* Type badge — top left */}
      <span
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          fontSize: 9,
          color: '#eeeef0',
          padding: '2px 6px',
          borderRadius: 4,
          background: 'rgba(7,9,15,0.78)',
          backdropFilter: 'blur(4px)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {isVideo ? '▶ video' : '◻ photo'}
      </span>

      {/* Duration badge — top right (video only) */}
      {isVideo && video.durationSeconds != null && (
        <span
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            fontSize: 10,
            color: '#eeeef0',
            padding: '2px 6px',
            borderRadius: 4,
            background: 'rgba(7,9,15,0.82)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {fmtDuration(video.durationSeconds)}
        </span>
      )}

      {/* Name + city — bottom overlay */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 12px 14px' }}>
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 15,
            fontStyle: 'italic',
            color: '#eeeef0',
            lineHeight: 1.2,
            marginBottom: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {video.companionName ?? 'Companion'}
        </p>
        {video.city && (
          <p style={{ fontSize: 10.5, color: '#9ca3af', margin: 0 }}>{video.city}</p>
        )}
      </div>
    </div>
    </Link>
  )
})

export default VideoCard
