import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import GeoPageBinder from './GeoPageBinder'

interface CompanionRow {
  id: string
  alias: string | null
  name: string | null
  tagline: string | null
  city: string | null
  hourly_rate: string | null
  currency: string | null
  photo_url: string | null
}

interface BoostRow {
  boost_type: string
  banner_headline: string | null
  banner_tagline: string | null
  banner_image_url: string | null
  companion_name: string | null
  companion_alias: string | null
  photo_url: string | null
}

const GENDER_LABELS: Record<string, { title: string; desc: string; seoTitle: string; seoDesc: string }> = {
  female: {
    title: 'Female Time & Companionship',
    desc: 'women available for time & companionship',
    seoTitle: 'Female Companions',
    seoDesc: 'women available for time and companionship',
  },
  male: {
    title: 'Male Time & Companionship',
    desc: 'men available for time & companionship',
    seoTitle: 'Male Companions',
    seoDesc: 'men available for time and companionship',
  },
  shemale: {
    title: 'Trans Companions & TS Escorts',
    desc: 'trans companions available for time & companionship',
    seoTitle: 'Trans Companions · TS Escorts',
    seoDesc: 'trans companions and TS escorts available for time and companionship',
  },
}

export function genderCityMeta(gender: string, country: string, city: string) {
  const cityDisplay = city.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const countryDisplay = country.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const g = GENDER_LABELS[gender] ?? GENDER_LABELS.female

  return {
    title: `${g.seoTitle} in ${cityDisplay} — Time & Companionship | BlushBite`,
    description: `Browse ${g.seoDesc} in ${cityDisplay}, ${countryDisplay}. Verified profiles. EU-hosted · GDPR compliant · BlushBite.`,
    robots: { index: true, follow: true },
    alternates: { canonical: `https://blushbite.co/${gender}/${country}/${city}` },
    openGraph: {
      type: 'website' as const,
      url: `https://blushbite.co/${gender}/${country}/${city}`,
      title: `${g.seoTitle} in ${cityDisplay} — BlushBite`,
      description: `${cityDisplay} ${g.seoDesc}.`,
      images: [{ url: '/bb.png', width: 1200, height: 630 }],
    },
  }
}

export default async function GenderCityPage({
  gender,
  country,
  city,
}: {
  gender: string
  country: string
  city: string
}) {
  const [rows, boostRows] = await Promise.all([
    db.execute(sql`
      SELECT
        c.id,
        c.alias,
        c.name,
        cp.tagline,
        cp.city,
        cp.hourly_rate::text AS hourly_rate,
        cp.currency,
        ph.url AS photo_url
      FROM companion_profiles cp
      JOIN companions c ON c.id = cp.companion_id
      LEFT JOIN companion_photos ph
        ON ph.companion_profile_id = cp.id
        AND ph.is_primary = true
        AND ph.deleted_at IS NULL
        AND ph.is_approved = true
      WHERE cp.country_slug = ${country}
        AND cp.city_slug = ${city}
        AND c.gender_community = ${gender}
        AND cp.is_live = true
        AND cp.is_visible_to_users = true
      ORDER BY cp.profile_completeness DESC, cp.updated_at DESC
      LIMIT 60
    `),
    db.execute(sql`
      SELECT
        cb.boost_type,
        cb.banner_headline,
        cb.banner_tagline,
        cb.banner_image_url,
        c.name  AS companion_name,
        c.alias AS companion_alias,
        ph.url  AS photo_url
      FROM companion_boosts cb
      JOIN companions c ON c.id = cb.companion_id
      LEFT JOIN companion_profiles cp ON cp.companion_id = c.id
      LEFT JOIN companion_photos ph
        ON ph.companion_profile_id = cp.id
        AND ph.is_primary = true
        AND ph.deleted_at IS NULL
        AND ph.is_approved = true
      WHERE cb.community = ${gender}
        AND cb.status = 'active'
        AND cb.is_enabled = true
        AND cb.week_start <= CURRENT_DATE
        AND cb.week_end >= CURRENT_DATE
        AND cb.boost_type IN ('header_banner', 'right_rail')
      ORDER BY cb.boost_type DESC
    `),
  ])

  const companions = rows as unknown as CompanionRow[]
  if (companions.length === 0) notFound()

  const boosts = boostRows as unknown as BoostRow[]
  const headerBoost = boosts.find((b) => b.boost_type === 'header_banner') ?? null
  const railBoost = boosts.find((b) => b.boost_type === 'right_rail') ?? null

  const cityDisplay = city.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const countryDisplay = country.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const g = GENDER_LABELS[gender] ?? GENDER_LABELS.female

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BlushBite', item: 'https://blushbite.co' },
      { '@type': 'ListItem', position: 2, name: g.seoTitle, item: `https://blushbite.co/${gender}` },
      { '@type': 'ListItem', position: 3, name: countryDisplay, item: `https://blushbite.co/${gender}/${country}` },
      { '@type': 'ListItem', position: 4, name: `${g.seoTitle} in ${cityDisplay}`, item: `https://blushbite.co/${gender}/${country}/${city}` },
    ],
  }

  const listJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${g.seoTitle} in ${cityDisplay}`,
    description: `Adults advertising their time and companionship in ${cityDisplay}, ${countryDisplay}`,
    numberOfItems: companions.length,
    url: `https://blushbite.co/${gender}/${country}/${city}`,
  }

  return (
    <>
      <GeoPageBinder gender={gender} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Disclaimer */}
        <p className="text-[10px] text-[#374151] mb-8 leading-relaxed max-w-2xl">
          This website only allows adult individuals to advertise their time and companionship to
          other adult individuals. BlushBite is an advertising platform only. All users must be 18+.
        </p>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#4b5563] mb-6 flex-wrap">
          <Link href={`/${gender}`} className="hover:text-[#9ca3af] transition-colors capitalize">
            {gender === 'shemale' ? 'Trans' : gender}
          </Link>
          <span>/</span>
          <Link href={`/${gender}/${country}`} className="hover:text-[#9ca3af] transition-colors">
            {countryDisplay}
          </Link>
          <span>/</span>
          <span className="text-[#6b7280]">{cityDisplay}</span>
        </nav>

        {/* H1 */}
        <h1
          className="text-3xl sm:text-4xl mb-2 leading-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {cityDisplay} —{' '}
          <em className="italic" style={{ color: '#e8607a' }}>
            {g.title}
          </em>
        </h1>
        <p className="text-sm text-[#6b7280] mb-8">
          {companions.length} companion{companions.length !== 1 ? 's' : ''} in {cityDisplay},{' '}
          {countryDisplay}
        </p>

        {/* Header Banner Ad */}
        {headerBoost && <HeaderBannerAd boost={headerBoost} cityDisplay={cityDisplay} />}

        {/* Main content — companion grid + optional right rail */}
        <div className={railBoost ? 'flex gap-6 items-start' : ''}>
          {/* Companion grid */}
          <div className={railBoost ? 'flex-1 min-w-0' : ''}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {companions.map((c) => (
                <GeoCompanionCard key={c.id} companion={c} countryDisplay={countryDisplay} />
              ))}
            </div>
          </div>

          {/* Right Rail Ad — desktop only */}
          {railBoost && (
            <div className="hidden lg:block w-[220px] flex-shrink-0 sticky top-8">
              <RightRailAd boost={railBoost} />
            </div>
          )}
        </div>

        {/* SEO copy */}
        <div className="mt-16 pt-8 border-t border-[#1c2333]">
          <h2
            className="text-lg mb-3"
            style={{ fontFamily: 'var(--font-serif)', color: '#9ca3af' }}
          >
            {g.seoTitle} in {cityDisplay}
          </h2>
          <p className="text-xs text-[#4b5563] leading-relaxed max-w-2xl">
            BlushBite connects adult individuals seeking companionship and quality time with verified
            companions in {cityDisplay}, {countryDisplay}. Every companion manages their own
            profile — their availability, rates, and preferences are set entirely by them. BlushBite
            is an EU-hosted platform operating under Netherlands law and GDPR.
          </p>
        </div>
      </main>
    </>
  )
}

// ─── Ad Components ────────────────────────────────────────────────────────────

function HeaderBannerAd({
  boost,
  cityDisplay,
}: {
  boost: BoostRow
  cityDisplay: string
}) {
  const photo = boost.banner_image_url || boost.photo_url
  const displayName = boost.companion_alias || boost.companion_name || 'Featured'

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-10" style={{ minHeight: 200 }}>
      {/* Background photo */}
      {photo ? (
        <Image
          src={photo}
          alt={`${displayName} — featured companion in ${cityDisplay}`}
          fill
          className="object-cover object-top"
          sizes="(max-width: 1024px) 100vw, 960px"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-[#0d1117]" />
      )}

      {/* Dark gradient overlay — left-heavy */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(7,9,15,0.95) 0%, rgba(7,9,15,0.80) 40%, rgba(7,9,15,0.30) 70%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-8 sm:p-10 max-w-[480px]">
        {/* Featured badge */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-[10px] tracking-[0.12em] uppercase px-3 py-1 rounded-full"
            style={{
              background: 'rgba(201,169,110,0.12)',
              color: '#c9a96e',
              border: '1px solid rgba(201,169,110,0.25)',
            }}
          >
            Featured
          </span>
        </div>

        {/* Headline */}
        <h2
          className="text-2xl sm:text-3xl leading-tight mb-2"
          style={{ fontFamily: 'var(--font-serif)', color: '#eeeef0' }}
        >
          {boost.banner_headline || `Meet ${displayName}`}
        </h2>

        {/* Tagline */}
        {boost.banner_tagline && (
          <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
            {boost.banner_tagline}
          </p>
        )}

        {/* CTA */}
        <a
          href="https://blushbite.co/home"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-[rgba(232,96,122,0.22)]"
          style={{
            background: 'rgba(232,96,122,0.12)',
            color: '#e8607a',
            border: '1px solid rgba(232,96,122,0.30)',
          }}
        >
          View profile
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {/* Ad label */}
      <div
        className="absolute top-3 right-3 text-[9px] tracking-widest uppercase"
        style={{ color: '#4b5563' }}
      >
        Ad
      </div>
    </div>
  )
}

function RightRailAd({ boost }: { boost: BoostRow }) {
  const photo = boost.banner_image_url || boost.photo_url
  const displayName = boost.companion_alias || boost.companion_name || 'Featured'

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#0d1117', border: '1px solid rgba(201,169,110,0.18)' }}
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#111620]">
        {photo ? (
          <Image
            src={photo}
            alt={`${displayName} — featured`}
            fill
            className="object-cover object-top"
            sizes="220px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl text-[#1c2333]">✦</span>
          </div>
        )}
        {/* Gradient at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background: 'linear-gradient(to top, rgba(13,17,23,0.95), transparent)',
          }}
        />
        {/* Featured badge */}
        <div className="absolute top-2 left-2">
          <span
            className="text-[9px] tracking-[0.10em] uppercase px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(201,169,110,0.18)',
              color: '#c9a96e',
              border: '1px solid rgba(201,169,110,0.30)',
            }}
          >
            Featured
          </span>
        </div>
        {/* Ad label */}
        <div
          className="absolute top-2 right-2 text-[9px] tracking-widest uppercase"
          style={{ color: '#4b5563' }}
        >
          Ad
        </div>
      </div>

      {/* Text content */}
      <div className="p-4">
        <p
          className="text-sm font-medium mb-1 leading-snug"
          style={{ color: '#eeeef0', fontFamily: 'var(--font-serif)' }}
        >
          {boost.banner_headline || displayName}
        </p>
        {boost.banner_tagline && (
          <p className="text-xs mb-4 leading-snug" style={{ color: '#6b7280' }}>
            {boost.banner_tagline}
          </p>
        )}
        <a
          href="https://blushbite.co/home"
          className="block text-center text-xs py-2.5 rounded-xl transition-all"
          style={{
            background: 'rgba(232,96,122,0.10)',
            color: '#e8607a',
            border: '1px solid rgba(232,96,122,0.25)',
          }}
        >
          View profile
        </a>
      </div>
    </div>
  )
}

// ─── Companion Card ────────────────────────────────────────────────────────────

function GeoCompanionCard({
  companion,
  countryDisplay,
}: {
  companion: CompanionRow
  countryDisplay: string
}) {
  const displayName = companion.alias || companion.name || 'Companion'
  const rate =
    companion.hourly_rate && parseFloat(companion.hourly_rate) > 0
      ? `${companion.currency ?? '€'}${parseFloat(companion.hourly_rate).toFixed(0)}/hr`
      : null

  return (
    <a
      href="https://blushbite.co/home"
      className="block bg-[#0d1117] border border-[#1c2333] rounded-2xl overflow-hidden hover:border-[rgba(232,96,122,0.35)] transition-colors group"
    >
      <div className="aspect-[3/4] relative bg-[#111620] overflow-hidden">
        {companion.photo_url ? (
          <Image
            src={companion.photo_url}
            alt={`${displayName} — companion in ${companion.city ?? countryDisplay}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-[#1c2333]">✦</span>
          </div>
        )}
        {rate && (
          <div className="absolute bottom-2 right-2 bg-[rgba(7,9,15,0.85)] text-[#c9a96e] text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm">
            {rate}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-medium text-[#eeeef0] truncate">{displayName}</div>
        {companion.tagline && (
          <div className="text-xs text-[#6b7280] mt-1 line-clamp-2 leading-snug">
            {companion.tagline}
          </div>
        )}
      </div>
    </a>
  )
}
