import type { MetadataRoute } from 'next'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

const BASE_URL = 'https://blushbite.co'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Fetch all live city combinations
  let cityRows: { country_slug: string; city_slug: string; last_active: Date }[] = []
  let countryRows: { country_slug: string }[] = []

  try {
    const cityResult = await db.execute(sql`
      SELECT DISTINCT
        cp.country_slug,
        cp.city_slug,
        MAX(cp.updated_at) AS last_active
      FROM companion_profiles cp
      WHERE cp.is_live = true
        AND cp.is_visible_to_users = true
        AND cp.country_slug IS NOT NULL
        AND cp.city_slug IS NOT NULL
      GROUP BY cp.country_slug, cp.city_slug
    `)
    cityRows = cityResult as unknown as typeof cityRows

    const countryResult = await db.execute(sql`
      SELECT DISTINCT cp.country_slug
      FROM companion_profiles cp
      WHERE cp.is_live = true
        AND cp.is_visible_to_users = true
        AND cp.country_slug IS NOT NULL
    `)
    countryRows = countryResult as unknown as typeof countryRows
  } catch {
    // Return static pages if DB is unavailable at build time
    return staticPages
  }

  const countryPages: MetadataRoute.Sitemap = countryRows.map((r) => ({
    url: `${BASE_URL}/${r.country_slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  }))

  const cityPages: MetadataRoute.Sitemap = cityRows.map((r) => ({
    url: `${BASE_URL}/${r.country_slug}/${r.city_slug}`,
    lastModified: r.last_active ?? new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [...staticPages, ...countryPages, ...cityPages]
}
