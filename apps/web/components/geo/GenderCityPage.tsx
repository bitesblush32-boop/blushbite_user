import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

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
  const rows = await db.execute(sql`
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
  `)

  const companions = rows as unknown as CompanionRow[]
  if (companions.length === 0) notFound()

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
        <p className="text-sm text-[#6b7280] mb-10">
          {companions.length} companion{companions.length !== 1 ? 's' : ''} in {cityDisplay},{' '}
          {countryDisplay}
        </p>

        {/* Companion grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {companions.map((c) => (
            <GeoCompanionCard key={c.id} companion={c} countryDisplay={countryDisplay} />
          ))}
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
