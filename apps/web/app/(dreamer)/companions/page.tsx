'use client'

import { useRef, useEffect, useState, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, CheckCircle, ChevronDown, Navigation } from 'lucide-react'
import { useDeviceCommunity } from '@/hooks/useDeviceCommunity'
import { useDiscoverCompanions } from '@/hooks/useDiscoverCompanions'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useActiveBoosts } from '@/hooks/useActiveBoosts'
import type { DiscoverCompanionItem } from '@/hooks/useDiscoverCompanions'
import type { ActiveBoostItem } from '@/hooks/useActiveBoosts'

// ── Config ───────────────────────────────────────────────────────────────────

const COMMUNITY_CONFIG = {
  female:  { label: 'Female', accentColor: '#e8607a' },
  male:    { label: 'Men',    accentColor: '#60a5fa' },
  shemale: { label: 'Trans',  accentColor: '#c084fc' },
} as const
type Community = keyof typeof COMMUNITY_CONFIG

const AGE_RANGES = [
  { label: 'Any age', min: null as number | null, max: null as number | null },
  { label: '18 – 25', min: 18,  max: 25  },
  { label: '26 – 35', min: 26,  max: 35  },
  { label: '36 – 45', min: 36,  max: 45  },
  { label: '45+',     min: 45,  max: null as number | null },
]

// ── CompanionCard ─────────────────────────────────────────────────────────────

const CompanionCard = memo(function CompanionCard({
  companion,
  accentColor,
  index,
}: {
  companion: DiscoverCompanionItem
  accentColor: string
  index: number
}) {
  const href = companion.id ? `/companions/${companion.id}` : '#'

  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        display: 'block',
        animationName: 'bb-card-in',
        animationDuration: '0.3s',
        animationTimingFunction: 'ease',
        animationFillMode: 'both',
        animationDelay: `${Math.min(index % 12, 11) * 40}ms`,
      }}
    >
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          background: companion.gradient,
          border: '1px solid #1c2333',
          cursor: 'pointer',
          transition: 'border-color 0.15s, transform 0.15s',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = `${accentColor}55`
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = '#1c2333'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }}
      >
        {/* Photo */}
        <div style={{ position: 'relative', aspectRatio: '3/4', background: companion.gradient }}>
          {companion.primaryPhotoUrl && (
            <Image
              src={companion.primaryPhotoUrl}
              alt={companion.name ?? 'Companion'}
              fill
              style={{ objectFit: 'cover', objectPosition: 'top' }}
              sizes="(max-width: 480px) 50vw, (max-width: 960px) 25vw, 200px"
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(7,9,15,0.9) 0%, transparent 55%)',
            }}
          />
          {companion.isVerified && (
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <CheckCircle size={14} color="#c9a96e" fill="rgba(201,169,110,0.2)" />
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 15,
                color: '#eeeef0',
                marginBottom: 2,
                lineHeight: 1.2,
              }}
            >
              {companion.name}
              {companion.age ? `, ${companion.age}` : ''}
            </p>
            {companion.city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={10} color={accentColor} />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{companion.city}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info strip */}
        <div style={{ padding: '10px 12px' }}>
          {companion.vibe && (
            <p
              style={{
                fontSize: 11,
                color: '#6b7280',
                lineHeight: 1.4,
                marginBottom: companion.minPrice ? 6 : 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {companion.vibe}
            </p>
          )}
          {companion.minPrice && (
            <span
              style={{
                fontSize: 11,
                color: accentColor,
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}30`,
                borderRadius: 999,
                padding: '2px 8px',
                display: 'inline-block',
              }}
            >
              from {companion.minPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
})

// ── CommunityPicker ───────────────────────────────────────────────────────────

function CommunityPicker({ onPick }: { onPick: (c: string) => Promise<void> }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07090f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 20px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26,
            color: '#eeeef0',
            marginBottom: 8,
            lineHeight: 1.3,
          }}
        >
          Who are you looking{' '}
          <em style={{ fontStyle: 'italic', color: '#e8607a' }}>for?</em>
        </p>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 36 }}>
          We&apos;ll remember your preference.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {(Object.entries(COMMUNITY_CONFIG) as [Community, { label: string; accentColor: string }][]).map(
            ([key, cfg]) => (
              <button
                key={key}
                onClick={() => onPick(key)}
                style={{
                  padding: '14px 30px',
                  borderRadius: 12,
                  background: `${cfg.accentColor}10`,
                  border: `1px solid ${cfg.accentColor}40`,
                  color: cfg.accentColor,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s, transform 0.1s',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = `${cfg.accentColor}20`
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = `${cfg.accentColor}10`
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}
              >
                {cfg.label}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: 16,
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: 14,
            aspectRatio: '3/4',
            background: '#0d1117',
            border: '1px solid #1c2333',
            animationName: 'bb-pulse',
            animationDuration: '1.5s',
            animationTimingFunction: 'ease',
            animationIterationCount: 'infinite',
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  )
}

// ── Boost components ──────────────────────────────────────────────────────────

function HeaderBannerAd({ data }: { data: ActiveBoostItem }) {
  const href = data.companion_id ? `/companions/${data.companion_id}` : '/companions'
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: data.banner_image_url
            ? `linear-gradient(135deg,rgba(7,9,15,0.85),rgba(7,9,15,0.6)),url(${data.banner_image_url}) center/cover`
            : 'linear-gradient(135deg,#140d1f,#1a1228)',
          borderBottom: '1px solid rgba(232,96,122,0.2)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <div>
          <span
            style={{
              fontSize: 10,
              color: '#c9a96e',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 3,
              display: 'block',
            }}
          >
            Sponsored
          </span>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 15,
              color: '#eeeef0',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {data.banner_headline ?? data.companion_name}
          </p>
          {(data.banner_tagline_text ?? data.companion_tagline) && (
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
              {data.banner_tagline_text ?? data.companion_tagline}
            </p>
          )}
        </div>
        <span
          style={{
            fontSize: 12,
            color: '#e8607a',
            border: '1px solid rgba(232,96,122,0.35)',
            borderRadius: 8,
            padding: '6px 14px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          View profile →
        </span>
      </div>
    </Link>
  )
}

function FeaturedBoostCard({
  data,
  accentColor,
  index,
}: {
  data: ActiveBoostItem
  accentColor: string
  index: number
}) {
  const href = data.companion_id ? `/companions/${data.companion_id}` : '/companions'
  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        display: 'block',
        animationName: 'bb-card-in',
        animationDuration: '0.3s',
        animationTimingFunction: 'ease',
        animationFillMode: 'both',
        animationDelay: `${index * 40}ms`,
      }}
    >
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          background: 'linear-gradient(135deg,#1a1228,#2a1535)',
          border: `1px solid rgba(232,96,122,0.35)`,
          cursor: 'pointer',
          transition: 'border-color 0.15s, transform 0.15s',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,96,122,0.7)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,96,122,0.35)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }}
      >
        <div style={{ position: 'relative', aspectRatio: '3/4', background: 'linear-gradient(135deg,#1a1228,#2a1535)' }}>
          {data.companion_photo_url && (
            <Image
              src={data.companion_photo_url}
              alt={data.companion_name ?? 'Featured companion'}
              fill
              style={{ objectFit: 'cover', objectPosition: 'top' }}
              sizes="(max-width: 480px) 50vw, 200px"
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(7,9,15,0.9) 0%, transparent 55%)',
            }}
          />
          {/* Featured badge */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontSize: 10,
              color: '#e8607a',
              background: 'rgba(232,96,122,0.15)',
              border: '1px solid rgba(232,96,122,0.4)',
              borderRadius: 999,
              padding: '2px 8px',
            }}
          >
            ✦ Featured
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 15,
                color: '#eeeef0',
                marginBottom: 2,
                lineHeight: 1.2,
              }}
            >
              {data.companion_name}
            </p>
            {data.companion_city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={10} color={accentColor} />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{data.companion_city}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '10px 12px' }}>
          {data.companion_tagline && (
            <p
              style={{
                fontSize: 11,
                color: '#6b7280',
                lineHeight: 1.4,
                marginBottom: data.companion_min_rate ? 6 : 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {data.companion_tagline}
            </p>
          )}
          {data.companion_min_rate && (
            <span
              style={{
                fontSize: 11,
                color: '#e8607a',
                background: 'rgba(232,96,122,0.12)',
                border: '1px solid rgba(232,96,122,0.3)',
                borderRadius: 999,
                padding: '2px 8px',
                display: 'inline-block',
              }}
            >
              from {data.companion_min_rate}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function MidGridAd({ data }: { data: ActiveBoostItem }) {
  const href = data.companion_id ? `/companions/${data.companion_id}` : '/companions'
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          background: 'linear-gradient(135deg,#110d0a,#1a1510)',
          border: '1px solid rgba(201,169,110,0.15)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, transform 0.15s',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.4)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.15)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }}
      >
        <div style={{ position: 'relative', aspectRatio: '3/4', background: 'linear-gradient(135deg,#110d0a,#1a1510)' }}>
          {data.companion_photo_url && (
            <Image
              src={data.companion_photo_url}
              alt={data.companion_name ?? 'Sponsored'}
              fill
              style={{ objectFit: 'cover', objectPosition: 'top' }}
              sizes="(max-width: 480px) 50vw, 200px"
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(7,9,15,0.9) 0%, transparent 55%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 15,
                color: '#eeeef0',
                marginBottom: 2,
                lineHeight: 1.2,
              }}
            >
              {data.companion_name}
            </p>
            {data.companion_city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={10} color="#c9a96e" />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{data.companion_city}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '10px 12px' }}>
          {data.companion_tagline && (
            <p
              style={{
                fontSize: 11,
                color: '#6b7280',
                lineHeight: 1.4,
                marginBottom: data.companion_min_rate ? 6 : 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {data.companion_tagline}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {data.companion_min_rate && (
              <span
                style={{
                  fontSize: 11,
                  color: '#c9a96e',
                  background: 'rgba(201,169,110,0.1)',
                  border: '1px solid rgba(201,169,110,0.25)',
                  borderRadius: 999,
                  padding: '2px 8px',
                  display: 'inline-block',
                }}
              >
                from {data.companion_min_rate}
              </span>
            )}
            <span style={{ fontSize: 10, color: '#4b5563', marginLeft: 'auto' }}>Sponsored</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Shared select wrapper style ───────────────────────────────────────────────

const SELECT_BASE: React.CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  background: '#0d1117',
  border: '1px solid #1c2333',
  borderRadius: 10,
  color: '#eeeef0',
  fontSize: 13,
  padding: '8px 36px 8px 12px',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  minWidth: 150,
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CompanionsPage() {
  const { community, loading: communityLoading, needsPicker, bindCommunity } = useDeviceCommunity()
  const router = useRouter()
  const geo = useGeolocation()

  const [cities, setCities]             = useState<{ slug: string; name: string }[]>([])
  const [selectedCity, setSelectedCity] = useState('')          // '' = all cities
  const [ageRangeIndex, setAgeRangeIndex] = useState(0)
  const [geoSlug, setGeoSlug]           = useState<string | null>(null)  // detected city slug
  const geoCheckedRef                   = useRef(false)         // ref avoids effect deps
  const sentinelRef                     = useRef<HTMLDivElement>(null)

  const cfg =
    community && community in COMMUNITY_CONFIG
      ? COMMUNITY_CONFIG[community as Community]
      : null

  const selectedAge = AGE_RANGES[ageRangeIndex]

  const { companions, isLoading: isLoadingCards, hasNextPage, fetchNextPage, isFetchingMore } =
    useDiscoverCompanions({
      lat: null,
      lng: null,
      community: community ?? null,
      minAge: selectedAge.min,
      maxAge: selectedAge.max,
      enabled: !!community,   // don't fire until community is resolved
    })

  const { headerBanner, featuredBoosts, midGridBoost } = useActiveBoosts(community ?? null)

  // Fetch city list once community is known
  useEffect(() => {
    if (!community) return
    fetch(`/api/cities?community=${community}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCities)
      .catch(() => {})
  }, [community])

  // Auto-detect nearest city — pre-select in dropdown, don't auto-navigate
  useEffect(() => {
    if (geoCheckedRef.current) return
    if (!community) return
    if (geo.latitude === null || geo.longitude === null) return

    geoCheckedRef.current = true   // ref — doesn't trigger re-render

    fetch(`/api/companions/nearby-city?lat=${geo.latitude}&lng=${geo.longitude}&community=${community}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { slug: string | null; name: string | null } | null) => {
        if (data?.slug) {
          setGeoSlug(data.slug)
          setSelectedCity(data.slug)  // pre-select in dropdown — user navigates manually
        }
      })
      .catch(() => {})
  }, [geo.latitude, geo.longitude, community])

  // IntersectionObserver — infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingMore) fetchNextPage()
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingMore, fetchNextPage])

  function handleCityChange(slug: string) {
    setSelectedCity(slug)
    if (slug && community) {
      router.push(`/${community}/${slug}`)
    }
  }

  // ── Render states ──

  if (communityLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07090f', paddingTop: 76 }}>
        <style>{`@keyframes bb-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 24px' }}>
          <div
            style={{
              width: 220,
              height: 30,
              borderRadius: 8,
              background: '#1c2333',
              marginBottom: 24,
              animationName: 'bb-pulse',
              animationDuration: '1.5s',
              animationTimingFunction: 'ease',
              animationIterationCount: 'infinite',
            }}
          />
        </div>
        <GridSkeleton />
      </div>
    )
  }

  if (needsPicker) return <CommunityPicker onPick={bindCommunity} />

  if (!community || !cfg) return null

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', paddingTop: 76, paddingBottom: 80 }}>
      <style>{`
        @keyframes bb-card-in { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bb-pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .bb-sel:focus { border-color: ${cfg.accentColor}80 !important; outline: none; }
        .bb-sel:hover { border-color: #374151 !important; }
        .bb-sel option { background: #111620; }
      `}</style>

      {/* ── Header banner ad ── */}
      {headerBanner && <HeaderBannerAd data={headerBanner} />}

      {/* ── Header ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 24px' }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(22px, 4vw, 32px)',
            color: '#eeeef0',
            marginBottom: 6,
            lineHeight: 1.25,
          }}
        >
          Browse{' '}
          <em style={{ fontStyle: 'italic', color: cfg.accentColor }}>{cfg.label}</em>{' '}
          Companions
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          EU-hosted · GDPR compliant · Adults 18+ only
        </p>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>

          {/* City dropdown */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              className="bb-sel"
              style={SELECT_BASE}
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <option value="">
                {geo.loading ? 'Detecting city…' : 'All cities'}
              </option>
              {/* Detected city at top if it's not already in the fetched list */}
              {geoSlug && !cities.find((c) => c.slug === geoSlug) && (
                <option value={geoSlug}>
                  {geoSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} (near you)
                </option>
              )}
              {cities.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}{geoSlug === c.slug ? ' (near you)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              color="#6b7280"
              style={{ position: 'absolute', right: 10, pointerEvents: 'none' }}
            />
          </div>

          {/* Age dropdown */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              className="bb-sel"
              style={{ ...SELECT_BASE, minWidth: 120 }}
              value={ageRangeIndex}
              onChange={(e) => setAgeRangeIndex(Number(e.target.value))}
            >
              {AGE_RANGES.map((r, i) => (
                <option key={i} value={i}>{r.label}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              color="#6b7280"
              style={{ position: 'absolute', right: 10, pointerEvents: 'none' }}
            />
          </div>

          {/* "Near me" button — only when geo not yet asked */}
          {geo.permission === 'prompt' && !geo.loading && (
            <button
              onClick={geo.requestLocation}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: cfg.accentColor,
                background: `${cfg.accentColor}10`,
                border: `1px solid ${cfg.accentColor}30`,
                borderRadius: 8,
                padding: '8px 13px',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.background = `${cfg.accentColor}20` }}
              onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.background = `${cfg.accentColor}10` }}
            >
              <Navigation size={12} />
              Near me
            </button>
          )}

          {/* Active filter pills */}
          {ageRangeIndex !== 0 && (
            <button
              onClick={() => setAgeRangeIndex(0)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                color: '#9ca3af',
                background: '#0d1117',
                border: '1px solid #1c2333',
                borderRadius: 8,
                padding: '8px 13px',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {AGE_RANGES[ageRangeIndex].label} ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      {isLoadingCards ? (
        <GridSkeleton />
      ) : companions.length === 0 ? (
        <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
          <div
            style={{
              padding: '48px 32px',
              borderRadius: 16,
              background: '#0d1117',
              border: '1px solid #1c2333',
            }}
          >
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20,
                color: '#eeeef0',
                marginBottom: 10,
              }}
            >
              No companions match these filters.
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
              Try a different age range or browse all cities.
            </p>
            {ageRangeIndex !== 0 && (
              <button
                onClick={() => setAgeRangeIndex(0)}
                style={{
                  fontSize: 13,
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: `${cfg.accentColor}12`,
                  border: `1px solid ${cfg.accentColor}35`,
                  color: cfg.accentColor,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Clear age filter
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: 16,
          }}
        >
          {/* Featured boost cards appear first */}
          {featuredBoosts.map((boost, i) => (
            <FeaturedBoostCard
              key={`featured-${boost.boost_type}`}
              data={boost}
              accentColor={cfg.accentColor}
              index={i}
            />
          ))}
          {/* Regular companions with mid-grid ad injected at position 3 */}
          {companions.map((c, i) => (
            <>
              {i === 3 && midGridBoost && (
                <MidGridAd key="mid-grid" data={midGridBoost} />
              )}
              <CompanionCard
                key={c.id}
                companion={c}
                accentColor={cfg.accentColor}
                index={i + featuredBoosts.length}
              />
            </>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1, marginTop: 32 }} />
      {isFetchingMore && (
        <p style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: '#4b5563' }}>
          Loading more…
        </p>
      )}

      {/* Companion join CTA */}
      {!isLoadingCards && (
        <div style={{ maxWidth: 960, margin: '48px auto 0', padding: '0 20px' }}>
          <div
            style={{
              padding: '24px',
              borderRadius: 16,
              background: '#0d1117',
              border: `1px solid ${cfg.accentColor}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 17,
                  color: '#eeeef0',
                  marginBottom: 4,
                }}
              >
                Are you a companion?
              </p>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                Join BlushBite — go live in minutes, no approval wait.
              </p>
            </div>
            <a
              href="https://blushbite.live"
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: '11px 22px',
                borderRadius: 10,
                background: cfg.accentColor,
                color: '#fff',
                textDecoration: 'none',
                flexShrink: 0,
                display: 'inline-block',
              }}
            >
              Join BlushBite →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
