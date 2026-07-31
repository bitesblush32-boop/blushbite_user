'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Shield } from 'lucide-react'
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
      style={{ textDecoration: 'none', display: 'block', flexShrink: 0, width: 190, ...style }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 14,
          overflow: 'hidden',
          aspectRatio: '2 / 3',
          background: companion.gradient,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(232,96,122,0.6)'
          el.style.transform = 'translateY(-4px) scale(1.01)'
          el.style.boxShadow = '0 20px 40px -10px rgba(232,96,122,0.25), 0 0 20px rgba(0,0,0,0.8)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(255, 255, 255, 0.08)'
          el.style.transform = 'translateY(0) scale(1)'
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
            sizes="(max-width: 640px) 50vw, 190px"
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

        {/* Top Badges Overlay (Verified & Available Status) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          {/* Status Dot */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-tight">Active</span>
          </div>

          {/* Verified Badge */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#111620]/80 backdrop-blur-md border border-[#e8607a]/40 text-[#e8607a]"
            title="Verified Identity"
          >
            <BadgeCheck size={12} className="text-[#e8607a]" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">Verified</span>
          </div>
        </div>

        {/* Deep gradient overlay — bottom half */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(7,9,15,0.98) 0%, rgba(7,9,15,0.6) 40%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        {/* Name + age + city — pinned to bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16,
                fontStyle: 'italic',
                color: '#eeeef0',
                lineHeight: 1.2,
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {companion.name}
              {companion.age ? `, ${companion.age}` : ''}
            </p>
          </div>

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
                  fontSize: 11,
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
