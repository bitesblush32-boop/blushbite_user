import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles } from '@/db/schema'
import { eq, and, isNotNull, sql, gte, lte, between } from 'drizzle-orm'

export interface NearbyCompanion {
  id:                  string
  companion_id:        string
  alias:               string | null
  name:                string | null
  city:                string | null
  tagline:             string | null
  hourly_rate:         string | null
  currency:            string
  availability_status: string
  body_type:           string | null
  height_cm:           number | null
  distance_km:         number
}

// ── GET /api/companions/nearby ───────────────────────────────────────────────

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)

  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  if (!latParam || !lngParam) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const lat    = parseFloat(latParam)
  const lng    = parseFloat(lngParam)
  const radius = Math.min(100, Math.max(5, parseFloat(searchParams.get('radius') ?? '25')))
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng must be numbers' }, { status: 400 })
  }

  // Optional filters
  const bodyType = searchParams.get('body_type')
  const minAge   = searchParams.get('min_age')   ? parseInt(searchParams.get('min_age')!, 10)   : null
  const maxAge   = searchParams.get('max_age')   ? parseInt(searchParams.get('max_age')!, 10)   : null

  // Bounding box pre-filter (avoids full table scan before haversine)
  const latDelta = radius / 111.0
  const lngDelta = radius / (111.0 * Math.cos((lat * Math.PI) / 180))
  const latMin   = lat - latDelta
  const latMax   = lat + latDelta
  const lngMin   = lng - lngDelta
  const lngMax   = lng + lngDelta

  // Haversine distance expression (km)
  const distanceExpr = sql<number>`ROUND(
    (6371 * acos(LEAST(1.0,
      cos(radians(${lat})) * cos(radians(${companionProfiles.latitude}::float8)) *
      cos(radians(${companionProfiles.longitude}::float8) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(${companionProfiles.latitude}::float8))
    )))::numeric,
    1
  )`

  const conditions = [
    eq(companionProfiles.is_visible_to_users, true),
    isNotNull(companionProfiles.latitude),
    isNotNull(companionProfiles.longitude),
    // Bounding box
    sql`${companionProfiles.latitude}::float8 BETWEEN ${latMin} AND ${latMax}`,
    sql`${companionProfiles.longitude}::float8 BETWEEN ${lngMin} AND ${lngMax}`,
    // Haversine radius
    sql`(6371 * acos(LEAST(1.0,
      cos(radians(${lat})) * cos(radians(${companionProfiles.latitude}::float8)) *
      cos(radians(${companionProfiles.longitude}::float8) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(${companionProfiles.latitude}::float8))
    ))) <= ${radius}`,
  ]

  if (bodyType) {
    conditions.push(eq(companionProfiles.body_type, bodyType))
  }

  if (minAge !== null || maxAge !== null) {
    const today  = new Date()
    if (maxAge !== null) {
      const minDob = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate())
      conditions.push(sql`${companions.date_of_birth} >= ${minDob.toISOString().split('T')[0]}`)
    }
    if (minAge !== null) {
      const maxDob = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate())
      conditions.push(sql`${companions.date_of_birth} <= ${maxDob.toISOString().split('T')[0]}`)
    }
  }

  const offset = (page - 1) * 20

  const rows = await db
    .select({
      id:                  companionProfiles.id,
      companion_id:        companionProfiles.companion_id,
      alias:               companions.alias,
      name:                companions.name,
      city:                companionProfiles.city,
      tagline:             companionProfiles.tagline,
      hourly_rate:         companionProfiles.hourly_rate,
      currency:            companionProfiles.currency,
      availability_status: companionProfiles.availability_status,
      body_type:           companionProfiles.body_type,
      height_cm:           companionProfiles.height_cm,
      distance_km:         distanceExpr,
    })
    .from(companionProfiles)
    .innerJoin(companions, eq(companions.id, companionProfiles.companion_id))
    .where(and(...conditions))
    .orderBy(distanceExpr)
    .limit(20)
    .offset(offset)

  // Count for pagination
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(companionProfiles)
    .innerJoin(companions, eq(companions.id, companionProfiles.companion_id))
    .where(and(...conditions))

  return NextResponse.json({
    data: rows,
    meta: {
      total,
      radius_km: radius,
      center:    { lat, lng },
    },
  })
}
