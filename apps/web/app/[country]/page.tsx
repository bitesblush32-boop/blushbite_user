import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export const revalidate = 3600

interface CityRow {
  city_slug: string
  city: string
  companion_count: string
}

interface PageParams {
  params: Promise<{ country: string }>
}

export async function generateStaticParams() {
  const rows = await db.execute(sql`
    SELECT DISTINCT cp.country_slug AS country
    FROM companion_profiles cp
    WHERE cp.is_live = true
      AND cp.is_visible_to_users = true
      AND cp.country_slug IS NOT NULL
  `)
  return (rows as unknown as { country: string }[]).map((r) => ({ country: r.country }))
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { country } = await params
  const countryDisplay = country.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    title: `${countryDisplay} Companions — Browse by City | BlushBite`,
    description: `Browse companions in ${countryDisplay} by city. Verified profiles available for time and companionship. EU-hosted · BlushBite.`,
    robots: { index: true, follow: true },
    alternates: { canonical: `https://blushbite.co/${country}` },
  }
}

export default async function CountryPage({ params }: PageParams) {
  const { country } = await params

  const rows = await db.execute(sql`
    SELECT
      cp.city_slug,
      cp.city,
      COUNT(DISTINCT c.id)::text AS companion_count
    FROM companion_profiles cp
    JOIN companions c ON c.id = cp.companion_id
    WHERE cp.country_slug = ${country}
      AND cp.is_live = true
      AND cp.is_visible_to_users = true
      AND cp.city_slug IS NOT NULL
      AND cp.city IS NOT NULL
    GROUP BY cp.city_slug, cp.city
    ORDER BY COUNT(DISTINCT c.id) DESC
  `)

  const cities = rows as unknown as CityRow[]
  if (cities.length === 0) notFound()

  const countryDisplay = country.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const totalCompanions = cities.reduce((s, r) => s + parseInt(r.companion_count, 10), 0)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BlushBite', item: 'https://blushbite.co' },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${countryDisplay} Companions`,
        item: `https://blushbite.co/${country}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Disclaimer */}
        <p className="text-[10px] text-[#374151] mb-8 leading-relaxed">
          This website only allows adult individuals to advertise their time and companionship.
          BlushBite is an advertising platform only. All users must be 18+.
        </p>

        {/* Breadcrumb */}
        <nav className="text-xs text-[#4b5563] mb-6">
          <Link href="https://blushbite.co/home" className="hover:text-[#9ca3af] transition-colors">
            BlushBite
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#6b7280]">{countryDisplay}</span>
        </nav>

        {/* H1 */}
        <h1
          className="text-3xl sm:text-4xl mb-2 leading-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {countryDisplay} —{' '}
          <em className="italic" style={{ color: '#e8607a' }}>
            Companions
          </em>
        </h1>
        <p className="text-sm text-[#6b7280] mb-10">
          {totalCompanions} companion{totalCompanions !== 1 ? 's' : ''} across {cities.length}{' '}
          {cities.length !== 1 ? 'cities' : 'city'}
        </p>

        {/* City list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cities.map((c) => {
            const cityDisplay =
              c.city || c.city_slug.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
            const count = parseInt(c.companion_count, 10)
            return (
              <Link
                key={c.city_slug}
                href={`/${country}/${c.city_slug}`}
                className="flex items-center justify-between bg-[#0d1117] border border-[#1c2333] rounded-xl px-5 py-4 hover:border-[rgba(232,96,122,0.35)] hover:bg-[rgba(232,96,122,0.03)] transition-all group"
              >
                <div>
                  <div className="text-sm font-medium text-[#eeeef0] group-hover:text-[#e8607a] transition-colors">
                    {cityDisplay}
                  </div>
                  <div className="text-xs text-[#4b5563] mt-0.5">
                    {count} companion{count !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className="text-[#e8607a] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </Link>
            )
          })}
        </div>

        {/* SEO copy */}
        <div className="mt-16 pt-8 border-t border-[#1c2333]">
          <h2
            className="text-lg mb-3"
            style={{ fontFamily: 'var(--font-serif)', color: '#9ca3af' }}
          >
            Companions in {countryDisplay}
          </h2>
          <p className="text-xs text-[#4b5563] leading-relaxed">
            BlushBite connects adult individuals with verified companions across {countryDisplay}.
            Browse by city to find companions near you. Each companion manages their own
            availability and rates. BlushBite operates under Netherlands law and GDPR compliance.
          </p>
        </div>
      </main>
    </>
  )
}
