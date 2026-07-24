import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { companions, companionProfiles } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'

const VALID_COMMUNITIES = ['female', 'male', 'shemale']

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const community = searchParams.get('community')

  if (isNaN(lat) || isNaN(lng) || !community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json({ slug: null, name: null })
  }

  // Reverse geocode via Nominatim (free, no key required)
  let cityName: string | null = null
  try {
    const nominatim = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: { 'User-Agent': 'BlushBite/1.0 (admin@blushbite.co)' },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (nominatim.ok) {
      const data = await nominatim.json()
      const addr = data.address ?? {}
      cityName = addr.city ?? addr.town ?? addr.municipality ?? addr.village ?? null
    }
  } catch {
    return NextResponse.json({ slug: null, name: null })
  }

  if (!cityName) return NextResponse.json({ slug: null, name: null })

  const slug = toSlug(cityName)

  // Check if we have any visible companions in this city for this community
  const [row] = await db
    .select({ city: companionProfiles.city })
    .from(companionProfiles)
    .innerJoin(companions, eq(companionProfiles.companion_id, companions.id))
    .where(
      and(
        eq(companionProfiles.is_visible_to_users, true),
        sql`${companionProfiles.city_slug} = ${slug}`,
        sql`${companions.gender_community} = ${community}`
      )
    )
    .limit(1)

  if (!row) return NextResponse.json({ slug: null, name: null })

  return NextResponse.json({ slug, name: row.city ?? cityName })
}
