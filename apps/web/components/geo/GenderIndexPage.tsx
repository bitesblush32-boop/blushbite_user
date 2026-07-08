import Link from 'next/link'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import GeoPageBinder from './GeoPageBinder'

interface CountryRow {
  country_slug: string
  count: string
}

const GENDER_LABELS: Record<string, { heading: string; sub: string }> = {
  female: {
    heading: 'Female Time & Companionship',
    sub: 'Women available for companionship by country',
  },
  male: {
    heading: 'Male Time & Companionship',
    sub: 'Men available for companionship by country',
  },
  shemale: {
    heading: 'Trans Companions & TS Escorts',
    sub: 'Trans companions and TS escorts by country',
  },
}

export default async function GenderIndexPage({ gender }: { gender: string }) {
  const rows = await db.execute(sql`
    SELECT
      cp.country_slug,
      COUNT(*) AS count
    FROM companion_profiles cp
    JOIN companions c ON c.id = cp.companion_id
    WHERE c.gender_community = ${gender}
      AND cp.is_live = true
      AND cp.is_visible_to_users = true
      AND cp.country_slug IS NOT NULL
    GROUP BY cp.country_slug
    ORDER BY count DESC
    LIMIT 30
  `)

  const countries = rows as unknown as CountryRow[]
  const g = GENDER_LABELS[gender] ?? GENDER_LABELS.female

  return (
    <>
    <GeoPageBinder gender={gender} />
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-[10px] text-[#374151] mb-8 leading-relaxed max-w-2xl">
        This website only allows adult individuals to advertise their time and companionship to other
        adult individuals. BlushBite is an advertising platform only. All users must be 18+.
      </p>

      <h1
        className="text-3xl sm:text-4xl mb-2 leading-tight"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        <em className="italic" style={{ color: '#e8607a' }}>
          {g.heading}
        </em>
      </h1>
      <p className="text-sm text-[#6b7280] mb-10">{g.sub}</p>

      {countries.length === 0 ? (
        <p className="text-sm text-[#4b5563]">No companions available yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {countries.map((row) => {
            const countryDisplay = row.country_slug
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())
            return (
              <Link
                key={row.country_slug}
                href={`/${gender}/${row.country_slug}`}
                className="block bg-[#0d1117] border border-[#1c2333] rounded-xl p-4 hover:border-[rgba(232,96,122,0.35)] transition-colors group"
              >
                <div className="text-sm font-medium text-[#eeeef0] group-hover:text-[#e8607a] transition-colors">
                  {countryDisplay}
                </div>
                <div className="text-xs text-[#6b7280] mt-1">
                  {row.count} companion{parseInt(row.count) !== 1 ? 's' : ''}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
    </>
  )
}
