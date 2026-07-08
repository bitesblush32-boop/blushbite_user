import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

interface CityRow {
  city_slug: string
  city: string | null
  count: string
}

const GENDER_LABELS: Record<string, { seoTitle: string; label: string }> = {
  female: { seoTitle: 'Female Companions', label: 'Female' },
  male: { seoTitle: 'Male Companions', label: 'Male' },
  shemale: { seoTitle: 'Trans Companions · TS Escorts', label: 'Trans' },
}

export function genderCountryMeta(gender: string, country: string) {
  const countryDisplay = country.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const g = GENDER_LABELS[gender] ?? GENDER_LABELS.female

  return {
    title: `${g.seoTitle} in ${countryDisplay} — Time & Companionship | BlushBite`,
    description: `Browse cities in ${countryDisplay} with ${g.seoTitle.toLowerCase()} available for time and companionship. Verified profiles. BlushBite.`,
    robots: { index: true, follow: true },
    alternates: { canonical: `https://blushbite.co/${gender}/${country}` },
  }
}

export default async function GenderCountryPage({
  gender,
  country,
}: {
  gender: string
  country: string
}) {
  const rows = await db.execute(sql`
    SELECT
      cp.city_slug,
      cp.city,
      COUNT(*) AS count
    FROM companion_profiles cp
    JOIN companions c ON c.id = cp.companion_id
    WHERE cp.country_slug = ${country}
      AND c.gender_community = ${gender}
      AND cp.is_live = true
      AND cp.is_visible_to_users = true
      AND cp.city_slug IS NOT NULL
    GROUP BY cp.city_slug, cp.city
    ORDER BY count DESC
    LIMIT 40
  `)

  const cities = rows as unknown as CityRow[]
  if (cities.length === 0) notFound()

  const countryDisplay = country.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const g = GENDER_LABELS[gender] ?? GENDER_LABELS.female

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BlushBite', item: 'https://blushbite.co' },
      { '@type': 'ListItem', position: 2, name: g.seoTitle, item: `https://blushbite.co/${gender}` },
      { '@type': 'ListItem', position: 3, name: countryDisplay, item: `https://blushbite.co/${gender}/${country}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-[10px] text-[#374151] mb-8 leading-relaxed max-w-2xl">
          This website only allows adult individuals to advertise their time and companionship to
          other adult individuals. BlushBite is an advertising platform only. All users must be 18+.
        </p>

        <nav className="flex items-center gap-2 text-xs text-[#4b5563] mb-6">
          <Link href={`/${gender}`} className="hover:text-[#9ca3af] transition-colors capitalize">
            {g.label}
          </Link>
          <span>/</span>
          <span className="text-[#6b7280]">{countryDisplay}</span>
        </nav>

        <h1
          className="text-3xl sm:text-4xl mb-2 leading-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {countryDisplay} —{' '}
          <em className="italic" style={{ color: '#e8607a' }}>
            {g.seoTitle}
          </em>
        </h1>
        <p className="text-sm text-[#6b7280] mb-10">
          {cities.length} cit{cities.length !== 1 ? 'ies' : 'y'} with companions
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {cities.map((city) => {
            const cityDisplay =
              city.city ??
              (city.city_slug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '')
            return (
              <Link
                key={city.city_slug}
                href={`/${gender}/${country}/${city.city_slug}`}
                className="block bg-[#0d1117] border border-[#1c2333] rounded-xl p-4 hover:border-[rgba(232,96,122,0.35)] transition-colors group"
              >
                <div className="text-sm font-medium text-[#eeeef0] group-hover:text-[#e8607a] transition-colors">
                  {cityDisplay}
                </div>
                <div className="text-xs text-[#6b7280] mt-1">
                  {city.count} companion{parseInt(city.count) !== 1 ? 's' : ''}
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </>
  )
}
