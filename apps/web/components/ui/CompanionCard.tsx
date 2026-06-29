'use client'

import React, { useCallback } from 'react'
import Image from 'next/image'
import { useQueryClient } from '@tanstack/react-query'
import type { Companion } from '@/lib/types'
import { useUIStore } from '@/store/uiStore'

interface Props {
  companion: Companion
  style?: React.CSSProperties
}

function CompanionCard({ companion, style }: Props) {
  const openModal = useUIStore((s) => s.openModal)
  const qc = useQueryClient()

  const prefetchProfile = useCallback(() => {
    qc.prefetchQuery({
      queryKey: ['companion-profile', companion.id],
      queryFn: () => fetch(`/api/companions/${companion.id}`).then((r) => r.json()),
      staleTime: 5 * 60 * 1000,
    })
  }, [companion.id, qc])

  return (
    <div
      className="w-[220px] flex-shrink-0 bg-[#111620] border border-[#1c2333] rounded-[14px] overflow-hidden cursor-pointer relative group transition-all duration-[250ms] hover:-translate-y-1"
      style={{
        ...style,
      }}
      onClick={() => openModal(companion.id)}
      onMouseEnter={(e) => {
        prefetchProfile()
        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(232,96,122,0.2)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Media */}
      <div
        className="h-[200px] relative overflow-hidden"
        style={{ background: companion.gradient }}
      >
        {/* Real photo — shown when available; silhouette shown as fallback */}
        {companion.photoUrl ? (
          <Image
            src={companion.photoUrl}
            alt={companion.name}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="70" height="140" viewBox="0 0 70 140" fill="rgba(255,255,255,0.12)">
              <ellipse cx="35" cy="22" rx="16" ry="18" />
              <path d="M12 68 Q18 45 35 43 Q52 45 58 68 L60 130 Q50 138 35 140 Q20 138 10 130Z" />
            </svg>
          </div>
        )}

        {/* Bottom gradient overlay — always shown so text is readable over photo */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(transparent 40%, rgba(7,9,15,0.85) 100%)' }}
        />

        {/* Location tag */}
        <div
          className="absolute top-[10px] left-[10px] text-[10px] text-[#eeeef0] px-2 py-[3px] rounded-full border border-white/[0.08] tracking-[0.04em]"
          style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(6px)' }}
        >
          Verified · {companion.city}
        </div>

        {/* Play button — reveals on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white text-sm"
            style={{ background: 'rgba(232,96,122,0.85)' }}
          >
            ▶
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-[14px]">
        <div className="text-[14px] font-medium text-[#eeeef0] mb-1">
          {companion.name} ·{' '}
          <span className="text-[#6b7280] font-normal text-[11.5px]">{companion.vibe}</span>
        </div>
        <div className="text-[11.5px] text-[#6b7280] mb-[10px]">
          {companion.city} · {companion.price}/evening
        </div>
        <div className="flex flex-wrap gap-[6px]">
          {companion.tags.map((tag) => (
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

export default React.memo(CompanionCard)
