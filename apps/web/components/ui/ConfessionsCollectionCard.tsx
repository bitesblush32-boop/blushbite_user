'use client'

import { memo } from 'react'
import { BookMarked } from 'lucide-react'

interface Props {
  count: number
  coverImages: string[] // up to 4
  title?: string // defaults to 'Confessions'
}

const ConfessionsCollectionCard = memo(function ConfessionsCollectionCard({
  count,
  coverImages,
  title = 'Confessions',
}: Props) {
  // Fill up to 4 quadrants — missing ones get a dark placeholder
  const quads = Array.from({ length: 4 }, (_, i) => coverImages[i] ?? null)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        height: 140,
        borderRadius: 14,
        overflow: 'hidden',
        background: '#0d1117',
        border: '1px solid #1c2333',
        cursor: 'default',
      }}
    >
      {/* Left — 2×2 cover mosaic (40% width) */}
      <div
        style={{
          width: '40%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
        }}
      >
        {quads.map((src, i) => (
          <div
            key={i}
            style={{
              background: src ? undefined : '#111620',
              backgroundImage: src ? `url(${src})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRight: i % 2 === 0 ? '1px solid #0d1117' : undefined,
              borderBottom: i < 2 ? '1px solid #0d1117' : undefined,
            }}
          />
        ))}
      </div>

      {/* Right — label (60% width) */}
      <div
        style={{
          flex: 1,
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <BookMarked size={16} color="#c9a96e" />
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 15,
            fontWeight: 600,
            color: '#eeeef0',
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{count} saved</div>
      </div>
    </div>
  )
})

export { ConfessionsCollectionCard }
