'use client'

import { useRef, useEffect, useState, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, CheckCircle, ChevronDown, Navigation } from 'lucide-react'
import { useDiscoverCompanions } from '@/hooks/useDiscoverCompanions'
import { useUIStore } from '@/store/uiStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useActiveBoosts } from '@/hooks/useActiveBoosts'
import { HeaderBannerAd, FeaturedBoostCard, MidGridAd, RightRailAd } from '@/components/ui/BoostAds'
import type { DiscoverCompanionItem } from '@/hooks/useDiscoverCompanions'

// ── Config ───────────────────────────────────────────────────────────────────

const COMMUNITY_CONFIG = {
  female: { label: 'Female', accentColor: '#e8607a' },
  male: { label: 'Men', accentColor: '#60a5fa' },
  shemale: { label: 'Shemale/TS', accentColor: '#c084fc' },
} as const
type Community = keyof typeof COMMUNITY_CONFIG

const AGE_RANGES = [
  { label: 'Any age', min: null as number | null, max: null as number | null },
  { label: '18 – 25', min: 18, max: 25 },
  { label: '26 – 35', min: 26, max: 35 },
  { label: '36 – 45', min: 36, max: 45 },
  { label: '45+', min: 45, max: null as number | null },
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
        width: '100%',
        animationName: 'bb-card-in',
        animationDuration: '0.3s',
        animationTimingFunction: 'ease',
        animationFillMode: 'both',
        animationDelay: `${Math.min(index % 12, 11) * 40}ms`,
      }}
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
          transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = `${accentColor}50`
          el.style.transform = 'translateY(-3px)'
          el.style.boxShadow = '0 20px 48px rgba(0,0,0,0.5)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = '#1c2333'
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
        }}
      >
        {companion.primaryPhotoUrl && (
          <Image
            src={companion.primaryPhotoUrl}
            alt={companion.name ?? 'Companion'}
            fill
            style={{ objectFit: 'cover', objectPosition: 'top' }}
            sizes="190px"
          />
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(7,9,15,0.96) 0%, rgba(7,9,15,0.5) 38%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {companion.isVerified && (
          <div
            style={{
              position: 'absolute', top: 10, right: 10, width: 20, height: 20,
              borderRadius: '50%', background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: '#c9a96e',
            }}
          >
            ✦
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 12px 14px' }}>
          <p
            style={{
              fontFamily: "'Playfair Display', serif", fontSize: 15, fontStyle: 'italic',
              color: '#eeeef0', lineHeight: 1.2, marginBottom: 4,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {companion.name}{companion.age ? `, ${companion.age}` : ''}
          </p>
          {companion.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 10.5, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {companion.city}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
})

// ── Skeleton ──────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="bb-companion-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: 14, aspectRatio: '2/3', background: '#0d1117', border: '1px solid #1c2333',
            animationName: 'bb-pulse', animationDuration: '1.5s', animationTimingFunction: 'ease',
            animationIterationCount: 'infinite', animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  )
}

// ── Shared select wrapper style ───────────────────────────────────────────────

const SELECT_BASE: React.CSSProperties = {
  appearance: 'none', WebkitAppearance: 'none', background: '#0d1117',
  border: '1px solid #1c2333', borderRadius: 10, color: '#eeeef0',
  fontSize: 13, padding: '8px 36px 8px 12px', cursor: 'pointer', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", minWidth: 150,
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CompanionsPage() {
  const community = useUIStore((s) => s.community)
  const communityLoading = useUIStore((s) => s.communityLoading)
  const router = useRouter()
  const geo = useGeolocation()

  const [cities, setCities] = useState<{ slug: string; name: string }[]>([])
  const [selectedCity, setSelectedCity] = useState('')
  const [ageRangeIndex, setAgeRangeIndex] = useState(0)
  const [geoSlug, setGeoSlug] = useState<string | null>(null)
  const geoCheckedRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const cfg =
    community && community in COMMUNITY_CONFIG ? COMMUNITY_CONFIG[community as Community] : null

  const selectedAge = AGE_RANGES[ageRangeIndex]

  const { companions, isLoading: isLoadingCards, hasNextPage, fetchNextPage, isFetchingMore } =
    useDiscoverCompanions({
      lat: null, lng: null,
      community: community ?? null,
      minAge: selectedAge.min,
      maxAge: selectedAge.max,
      enabled: !!community && !communityLoading,
    })

  const { headerBanner, featuredBoosts, midGridBoost, rightRailBoosts } = useActiveBoosts(community ?? null)

  useEffect(() => {
    if (!community) return
    fetch(`/api/cities?community=${community}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCities)
      .catch(() => {})
  }, [community])

  useEffect(() => {
    if (geoCheckedRef.current) return
    if (!community) return
    if (geo.latitude === null || geo.longitude === null) return
    geoCheckedRef.current = true
    fetch(`/api/companions/nearby-city?lat=${geo.latitude}&lng=${geo.longitude}&community=${community}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { slug: string | null; name: string | null } | null) => {
        if (data?.slug) {
          setGeoSlug(data.slug)
          setSelectedCity(data.slug)
        }
      })
      .catch(() => {})
  }, [geo.latitude, geo.longitude, community])

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
    if (slug && community) router.push(`/${community}/${slug}`)
  }

  // ── Render states ──

  if (communityLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07090f', paddingTop: 76 }}>
        <style>{`@keyframes bb-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 24px' }}>
          <div style={{ width: 220, height: 30, borderRadius: 8, background: '#1c2333', marginBottom: 24, animationName: 'bb-pulse', animationDuration: '1.5s', animationTimingFunction: 'ease', animationIterationCount: 'infinite' }} />
        </div>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>
          <GridSkeleton />
        </div>
      </div>
    )
  }

  if (!community || !cfg) return null

  const hasRail = rightRailBoosts.length > 0

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', paddingTop: 95, paddingBottom: 80 }}>
      <style>{`
        @keyframes bb-card-in { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bb-pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .bb-sel:focus { border-color: ${cfg.accentColor}80 !important; outline: none; }
        .bb-sel:hover { border-color: #374151 !important; }
        .bb-sel option { background: #111620; }
        .bb-companion-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          justify-content: start;
        }
        @media (min-width: 480px) {
          .bb-companion-grid {
            grid-template-columns: repeat(auto-fill, 190px);
            gap: 16px;
          }
        }
      `}</style>

      {/* ── Outer wrapper — matches /community max-w-[1400px] px-10 ── */}
      <div
        style={{
          maxWidth: hasRail ? 1400 : 1060,
          margin: '0 auto',
          padding: hasRail ? '0 40px' : '0 20px',
        }}
      >
        {/* ── Header banner ad (constrained to main content width) ── */}
        {headerBanner && <HeaderBannerAd data={headerBanner} />}
      </div>

      {/* ── Outer flex: main content + right rail ── */}
      <div
        style={{
          maxWidth: hasRail ? 1400 : 1060,
          margin: '0 auto',
          padding: hasRail ? '0 40px' : '0 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: hasRail ? 24 : 0,
        }}
      >
        {/* ── Main column — flex-1 fills remaining space (matches /community flex-1 min-w-0) ── */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>

          {/* Page header + filters */}
          <div style={{ padding: '32px 0 24px' }}>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(22px, 4vw, 32px)',
                color: '#eeeef0', marginBottom: 6, lineHeight: 1.25,
              }}
            >
              Browse <em style={{ fontStyle: 'italic', color: cfg.accentColor }}>{cfg.label}</em>{' '}
              Companions
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
              EU-hosted · GDPR compliant · Adults 18+ only
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              {/* City dropdown */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <select
                  className="bb-sel"
                  style={SELECT_BASE}
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                >
                  <option value="">{geo.loading ? 'Detecting city…' : 'All cities'}</option>
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
                <ChevronDown size={14} color="#6b7280" style={{ position: 'absolute', right: 10, pointerEvents: 'none' }} />
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
                <ChevronDown size={14} color="#6b7280" style={{ position: 'absolute', right: 10, pointerEvents: 'none' }} />
              </div>

              {/* Near me */}
              {geo.permission === 'prompt' && !geo.loading && (
                <button
                  onClick={geo.requestLocation}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12,
                    color: cfg.accentColor, background: `${cfg.accentColor}10`,
                    border: `1px solid ${cfg.accentColor}30`, borderRadius: 8, padding: '8px 13px',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${cfg.accentColor}20` }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${cfg.accentColor}10` }}
                >
                  <Navigation size={12} />
                  Near me
                </button>
              )}

              {/* Active age filter pill */}
              {ageRangeIndex !== 0 && (
                <button
                  onClick={() => setAgeRangeIndex(0)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12,
                    color: '#9ca3af', background: '#0d1117', border: '1px solid #1c2333',
                    borderRadius: 8, padding: '8px 13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
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
            <div style={{ padding: '40px 0' }}>
              <div
                style={{
                  padding: '48px 32px', borderRadius: 16, background: '#0d1117',
                  border: '1px solid #1c2333', textAlign: 'center',
                }}
              >
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#eeeef0', marginBottom: 10 }}>
                  No companions match these filters.
                </p>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                  Try a different age range or browse all cities.
                </p>
                {ageRangeIndex !== 0 && (
                  <button
                    onClick={() => setAgeRangeIndex(0)}
                    style={{
                      fontSize: 13, padding: '10px 20px', borderRadius: 10,
                      background: `${cfg.accentColor}12`, border: `1px solid ${cfg.accentColor}35`,
                      color: cfg.accentColor, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Clear age filter
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bb-companion-grid">
              {/* Featured boost cards appear first */}
              {featuredBoosts.map((boost) => (
                <div key={`featured-${boost.boost_type}`}>
                  <FeaturedBoostCard data={boost} />
                </div>
              ))}
              {/* Regular companions with mid-grid ad injected at position 3 */}
              {companions.map((c, i) => (
                <>
                  {i === 3 && midGridBoost && (
                    <div key="mid-grid">
                      <MidGridAd data={midGridBoost} />
                    </div>
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
            <div style={{ marginTop: 48 }}>
              <div
                style={{
                  padding: '24px', borderRadius: 16, background: '#0d1117',
                  border: `1px solid ${cfg.accentColor}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: 16,
                }}
              >
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: '#eeeef0', marginBottom: 4 }}>
                    Are you a companion?
                  </p>
                  <p style={{ fontSize: 13, color: '#6b7280' }}>
                    Join BlushBite — go live in minutes, no approval wait.
                  </p>
                </div>
                <a
                  href="https://blushbite.live"
                  style={{
                    fontSize: 13, fontWeight: 500, padding: '11px 22px', borderRadius: 10,
                    background: cfg.accentColor, color: '#fff', textDecoration: 'none',
                    flexShrink: 0, display: 'inline-block',
                  }}
                >
                  Join BlushBite →
                </a>
              </div>
            </div>
          )}
        </div>
        {/* end main column */}

        {/* ── Right rail ad placement (desktop ≥1280px) ── */}
        {hasRail && (
          <div
            className="hidden xl:flex flex-col flex-shrink-0 w-[200px] gap-3"
            style={{ position: 'sticky', top: 80, alignSelf: 'flex-start' }}
          >
            {rightRailBoosts.map((boost) => (
              <RightRailAd key={boost.id} data={boost} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
