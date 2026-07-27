'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Companion } from '@/lib/types'

interface Props {
  companion: Companion
  style?: React.CSSProperties
}

function CompanionCard({ companion, style }: Props) {
  return (
    <Link
      href={`/companions/${companion.id}`}
      prefetch={false}
      style={{ textDecoration: 'none', display: 'block', flexShrink: 0, width: 200, ...style }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          aspectRatio: '2 / 3',
          background: companion.gradient,
          border: '1px solid #1c2333',
          cursor: 'pointer',
          transition: 'border-color 0.2s, transform 0.2s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(232,96,122,0.45)'
          el.style.transform = 'translateY(-3px)'
          el.style.boxShadow = '0 20px 48px rgba(0,0,0,0.5)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = '#1c2333'
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
        }}
      >
        {/* Photo */}
        {companion.photoUrl ? (
          <Image
            src={companion.photoUrl}
            alt={companion.name}
            fill
            style={{ objectFit: 'cover', objectPosition: 'top' }}
            sizes="(max-width: 640px) 50vw, 220px"
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="60" height="120" viewBox="0 0 70 140" fill="rgba(255,255,255,0.1)">
              <ellipse cx="35" cy="22" rx="16" ry="18" />
              <path d="M12 68 Q18 45 35 43 Q52 45 58 68 L60 130 Q50 138 35 140 Q20 138 10 130Z" />
            </svg>
          </div>
        )}

        {/* Deep gradient overlay — bottom half */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(7,9,15,0.96) 0%, rgba(7,9,15,0.5) 38%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Name + age + city — pinned to bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 12px 14px' }}>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 15,
              fontStyle: 'italic',
              color: '#eeeef0',
              lineHeight: 1.2,
              marginBottom: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {companion.name}
            {companion.age ? `, ${companion.age}` : ''}
          </p>
          {companion.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#e8607a',
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: 10.5,
                  color: '#9ca3af',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {companion.city}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default React.memo(CompanionCard)
