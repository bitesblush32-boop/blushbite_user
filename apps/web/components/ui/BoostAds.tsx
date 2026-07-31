'use client'

/**
 * Shared boost/ad components used on both HomePageContent and /companions page.
 * All 4 placement types live here so style changes propagate everywhere.
 */

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ActiveBoostItem } from '@/hooks/useActiveBoosts'

// ─── Shared gradient palette (deterministic from companion id) ─────────────────

const CARD_GRADIENTS = [
  'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)',
  'linear-gradient(135deg,#0f1a28,#1f2840,#2a1020)',
  'linear-gradient(135deg,#201228,#1a2030,#2a1a18)',
]

function cardGradient(id: string | undefined) {
  const hash = (id ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return CARD_GRADIENTS[hash % CARD_GRADIENTS.length]
}

// ─── HeaderBannerAd ───────────────────────────────────────────────────────────
// Full-width strip. Supports promo_mode: profile_card | custom_image | animated_gif

export function HeaderBannerAd({ data }: { data: ActiveBoostItem }) {
  const href = data.profile_id ? `/companions/${data.profile_id}` : '/companions'
  const mode = data.promo_mode ?? 'custom_image'
  const isGif = mode === 'animated_gif'
  const isProfileCard = mode === 'profile_card'
  const hasCustomImage = !isProfileCard && !!data.banner_image_url
  const bgPhotoUrl = isProfileCard ? data.companion_photo_url : data.banner_image_url

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#c9a96e]/30 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4 min-h-[90px] shadow-xl backdrop-blur-md bg-gradient-to-r from-[#161220] via-[#1f162a] to-[#121624]">
      {bgPhotoUrl && (
        <>
          {isGif ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bgPhotoUrl}
              alt={data.banner_headline ?? 'Sponsored'}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
            />
          ) : (
            <Image
              src={bgPhotoUrl}
              alt={data.banner_headline ?? 'Sponsored'}
              fill
              className="object-cover opacity-40"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090f]/90 via-[#07090f]/75 to-[#07090f]/90" />
        </>
      )}

      <div className="relative z-10 min-w-0">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c9a96e]/15 border border-[#c9a96e]/40 text-[#c9a96e] text-[10px] font-semibold tracking-wider uppercase mb-1.5">
          <span>✦ Featured Companion Spotlight</span>
        </div>
        <div className="font-serif text-[17px] sm:text-[19px] text-[#eeeef0] leading-tight mb-1">
          {data.banner_headline ?? data.companion_name ?? 'Featured companion'}
          {data.banner_headline || isProfileCard ? '' : (
            <em className="text-[#e8607a] italic"> awaits.</em>
          )}
        </div>
        {(data.banner_tagline_text ?? (isProfileCard ? data.companion_tagline : null)) && (
          <p className="text-[12px] text-[#9ca3af] line-clamp-2">
            {data.banner_tagline_text ?? data.companion_tagline}
          </p>
        )}
      </div>

      <Link
        href={href}
        className="relative z-10 flex-shrink-0 text-[12.5px] font-medium px-4 py-2.5 rounded-xl bg-[#e8607a]/15 border border-[#e8607a]/40 text-[#e8607a] hover:bg-[#e8607a] hover:text-white transition-all shadow-[0_0_15px_rgba(232,96,122,0.25)] whitespace-nowrap self-stretch sm:self-auto text-center"
      >
        {isProfileCard ? 'View Profile →' : hasCustomImage ? 'Explore Now →' : 'View Profile →'}
      </Link>
    </div>
  )
}

// ─── FeaturedBoostCard ────────────────────────────────────────────────────────
// Companion card with rose border + "✦ Featured" badge — shown first in grid
// 2% larger than normal cards via scale(1.02)

export function FeaturedBoostCard({ data }: { data: ActiveBoostItem }) {
  const href = data.profile_id ? `/companions/${data.profile_id}` : '/companions'
  const gradient = cardGradient(data.companion_id ?? data.id)
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
      <div
        style={{
          borderRadius: 14, overflow: 'hidden',
          border: hovered ? '1px solid rgba(232,96,122,0.7)' : '1px solid rgba(232,96,122,0.35)',
          cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: 'relative', aspectRatio: '3/4', background: gradient }}>
          {data.companion_photo_url && (
            <Image src={data.companion_photo_url} alt={data.companion_name ?? 'Featured companion'} fill style={{ objectFit: 'cover', objectPosition: 'top' }} sizes="(max-width: 640px) 50vw, 220px" />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,9,15,0.9) 0%, transparent 50%)' }} />
          <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'rgba(232,96,122,0.18)', border: '1px solid rgba(232,96,122,0.5)', color: '#e8607a', fontWeight: 500, letterSpacing: '0.03em' }}>
            ✦ Featured
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#eeeef0', marginBottom: 2, lineHeight: 1.2 }}>
              {data.companion_name ?? 'Companion'}
            </p>
            {data.companion_city && <span style={{ fontSize: 11, color: '#9ca3af' }}>{data.companion_city}</span>}
          </div>
        </div>
        <div style={{ padding: '10px 12px', background: '#0d1117' }}>
          {data.companion_tagline && (
            <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4, marginBottom: data.companion_min_rate ? 6 : 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {data.companion_tagline}
            </p>
          )}
          {data.companion_min_rate && (
            <span style={{ fontSize: 11, color: '#e8607a', background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.25)', borderRadius: 999, padding: '2px 8px', display: 'inline-block' }}>
              from {data.companion_min_rate}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── MidGridAd ────────────────────────────────────────────────────────────────
// Same design as FeaturedBoostCard but with a gold "Sponsored" badge
// 2% larger than normal cards via scale(1.02)

export function MidGridAd({ data }: { data: ActiveBoostItem }) {
  const href = data.profile_id ? `/companions/${data.profile_id}` : '/companions'
  const gradient = cardGradient(data.companion_id ?? data.id)
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
      <div
        style={{
          borderRadius: 14, overflow: 'hidden',
          border: hovered ? '1px solid rgba(232,96,122,0.7)' : '1px solid rgba(232,96,122,0.35)',
          cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: 'relative', aspectRatio: '3/4', background: gradient }}>
          {data.companion_photo_url && (
            <Image src={data.companion_photo_url} alt={data.companion_name ?? 'Companion'} fill style={{ objectFit: 'cover', objectPosition: 'top' }} sizes="(max-width: 640px) 50vw, 220px" />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,9,15,0.9) 0%, transparent 50%)' }} />
          <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'rgba(201,169,110,0.18)', border: '1px solid rgba(201,169,110,0.5)', color: '#c9a96e', fontWeight: 500, letterSpacing: '0.03em' }}>
            Sponsored
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#eeeef0', marginBottom: 2, lineHeight: 1.2 }}>
              {data.companion_name ?? 'Companion'}
            </p>
            {data.companion_city && <span style={{ fontSize: 11, color: '#9ca3af' }}>{data.companion_city}</span>}
          </div>
        </div>
        <div style={{ padding: '10px 12px', background: '#0d1117' }}>
          {data.companion_tagline && (
            <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4, marginBottom: data.companion_min_rate ? 6 : 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {data.companion_tagline}
            </p>
          )}
          {data.companion_min_rate && (
            <span style={{ fontSize: 11, color: '#e8607a', background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.25)', borderRadius: 999, padding: '2px 8px', display: 'inline-block' }}>
              from {data.companion_min_rate}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── RightRailAd ─────────────────────────────────────────────────────────────
// 200px sticky companion card shown on xl screens (desktop right rail)

export function RightRailAd({ data }: { data: ActiveBoostItem }) {
  const href = data.profile_id ? `/companions/${data.profile_id}` : '/companions'
  const gradient = cardGradient(data.companion_id ?? data.id)
  const mode = data.promo_mode ?? 'custom_image'
  const isGif = mode === 'animated_gif'
  const isProfileCard = mode === 'profile_card'
  const imageUrl = isProfileCard ? data.companion_photo_url : data.banner_image_url
  const fallbackUrl = isProfileCard ? null : data.companion_photo_url

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(232,96,122,0.2)', background: '#0d1117' }}>
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ position: 'relative', aspectRatio: '200/286', background: gradient }}>
          {(imageUrl ?? fallbackUrl) && (
            isGif ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(imageUrl ?? fallbackUrl)!}
                alt={data.companion_name ?? 'Featured companion'}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
            ) : (
              <Image
                src={(imageUrl ?? fallbackUrl)!}
                alt={data.companion_name ?? 'Featured companion'}
                fill
                style={{ objectFit: 'cover', objectPosition: isProfileCard ? 'top' : 'center' }}
                sizes="200px"
              />
            )
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.95) 0%, transparent 55%)' }} />
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'rgba(232,96,122,0.12)', border: '1px solid rgba(232,96,122,0.3)', color: '#e8607a', fontWeight: 500, letterSpacing: '0.04em' }}>
            Promoted
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#eeeef0', marginBottom: 4, lineHeight: 1.2 }}>
              {data.banner_headline ?? data.companion_name ?? 'Private Companion'}
            </p>
            {data.companion_city && isProfileCard && (
              <p style={{ fontSize: 12, color: '#9ca3af' }}>{data.companion_city}</p>
            )}
          </div>
        </div>
      </Link>

      {isProfileCard && data.companion_min_rate && (
        <div style={{ padding: '10px 16px 14px' }}>
          <p style={{ fontSize: 12, color: '#e8607a', margin: 0 }}>
            From {data.companion_min_rate} / session
          </p>
        </div>
      )}
    </div>
  )
}
