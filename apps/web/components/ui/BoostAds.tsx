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
    <div
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        background: bgPhotoUrl ? 'transparent' : 'linear-gradient(135deg,#1a1228,#2a1535)',
        border: '1px solid rgba(232,96,122,0.2)',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        gap: 16,
        minHeight: 80,
      }}
    >
      {bgPhotoUrl && (
        <>
          {isGif ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bgPhotoUrl}
              alt={data.banner_headline ?? 'Sponsored'}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
          ) : (
            <Image
              src={bgPhotoUrl}
              alt={data.banner_headline ?? 'Sponsored'}
              fill
              style={{ objectFit: 'cover', objectPosition: isProfileCard ? 'top' : 'center' }}
              sizes="100vw"
            />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,9,15,0.55)' }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 10, color: '#c9a96e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 500 }}>
          Sponsored
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#eeeef0', lineHeight: 1.3, marginBottom: 2 }}>
          {data.banner_headline ?? data.companion_name ?? 'Featured companion'}
          {data.banner_headline || isProfileCard ? '' : (
            <em style={{ color: '#e8607a', fontStyle: 'italic' }}> awaits.</em>
          )}
        </div>
        {(data.banner_tagline_text ?? (isProfileCard ? data.companion_tagline : null)) && (
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {data.banner_tagline_text ?? data.companion_tagline}
          </p>
        )}
      </div>

      <Link
        href={href}
        style={{
          position: 'relative', zIndex: 1, flexShrink: 0,
          fontSize: 13, fontWeight: 500, padding: '10px 20px', borderRadius: 10,
          background: 'rgba(232,96,122,0.15)', border: '1px solid rgba(232,96,122,0.4)',
          color: '#e8607a', textDecoration: 'none', whiteSpace: 'nowrap',
        }}
      >
        {isProfileCard ? 'View profile →' : hasCustomImage ? 'Learn more →' : 'View profile →'}
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

// ─── SectionDividerAd ────────────────────────────────────────────────────────
// Full-width banner injected between the Hot Media Feed and companion listings.
// Mirrors the mid-page ad strip seen on shemalelisting.com below their feed.
// 1 slot per community per week. Supports profile_card | custom_image | animated_gif.

export function SectionDividerAd({ data }: { data: ActiveBoostItem }) {
  const href = data.profile_id ? `/companions/${data.profile_id}` : '/companions'
  const mode = data.promo_mode ?? 'profile_card'
  const isGif = mode === 'animated_gif'
  const isProfileCard = mode === 'profile_card'
  const bgUrl = isProfileCard ? data.companion_photo_url : data.banner_image_url

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 120,
        overflow: 'hidden',
        borderTop: '1px solid rgba(232,96,122,0.18)',
        borderBottom: '1px solid rgba(232,96,122,0.18)',
        background: bgUrl ? 'transparent' : 'linear-gradient(135deg,#0d1117,#111620)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '20px 24px',
        margin: '0 0 40px',
      }}
    >
      {/* Background image / gif */}
      {bgUrl && (
        <>
          {isGif ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bgUrl}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
          ) : (
            <Image
              src={bgUrl}
              alt=""
              fill
              style={{ objectFit: 'cover', objectPosition: isProfileCard ? 'top center' : 'center' }}
              sizes="100vw"
            />
          )}
          {/* Dark overlay — stronger for profile_card (face-heavy) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: isProfileCard
                ? 'linear-gradient(90deg,rgba(7,9,15,0.88) 0%,rgba(7,9,15,0.55) 60%,rgba(7,9,15,0.3) 100%)'
                : 'rgba(7,9,15,0.65)',
            }}
          />
        </>
      )}

      {/* Left — text block */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            color: '#c9a96e',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 6,
            fontWeight: 500,
          }}
        >
          Sponsored
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(16px, 2.5vw, 22px)',
            color: '#eeeef0',
            lineHeight: 1.25,
            marginBottom: 4,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {data.banner_headline ?? data.companion_name ?? 'Private Companion'}
          {!data.banner_headline && (
            <em style={{ fontStyle: 'italic', color: '#e8607a' }}> awaits.</em>
          )}
        </div>
        {(data.banner_tagline_text ?? (isProfileCard ? data.companion_tagline : null)) && (
          <p
            style={{
              fontSize: 13,
              color: '#9ca3af',
              margin: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {data.banner_tagline_text ?? data.companion_tagline}
          </p>
        )}
        {isProfileCard && data.companion_city && (
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{data.companion_city}</p>
        )}
      </div>

      {/* Right — CTA */}
      <Link
        href={href}
        style={{
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 500,
          padding: '10px 22px',
          borderRadius: 10,
          background: 'rgba(232,96,122,0.15)',
          border: '1px solid rgba(232,96,122,0.45)',
          color: '#e8607a',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(232,96,122,0.25)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(232,96,122,0.15)'
        }}
      >
        {isProfileCard ? 'View profile \u2192' : 'Learn more \u2192'}
      </Link>
    </div>
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
