import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import {
  companions,
  companionProfiles,
  companionPhotos,
  sessionCards,
  companionVibeTags,
  vibeTags,
} from '@/db/schema'
import { eq, and, isNull, isNotNull, asc, desc, inArray, sql, or } from 'drizzle-orm'

const LIMIT = 12

function currencySymbol(code: string): string {
  const map: Record<string, string> = { EUR: '€', INR: '₹', USD: '$', GBP: '£' }
  return map[code] ?? code
}

const GRADIENTS = [
  'linear-gradient(145deg,#1a1228,#2a1535,#1a2240)',
  'linear-gradient(145deg,#0f1a28,#1f2840,#2a1020)',
  'linear-gradient(145deg,#201228,#1a2030,#2a1a18)',
  'linear-gradient(145deg,#0a1620,#1a1535,#201a10)',
  'linear-gradient(145deg,#1a1020,#2a1530,#101820)',
  'linear-gradient(145deg,#101820,#201028,#102020)',
]
function gradientFromId(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}
function ageFromDob(dob: string | null): number | null {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}
function encodeCursor(score: number, id: string): string {
  return Buffer.from(JSON.stringify({ score, id })).toString('base64')
}
function decodeCursor(cursor: string): { score: number; id: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

const VALID_GENDERS = ['female', 'male', 'shemale']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const radiusParam = searchParams.get('radius')
  const cursorParam = searchParams.get('cursor')
  const genderParam = searchParams.get('gender')
  const gender = genderParam && VALID_GENDERS.includes(genderParam) ? genderParam : null
  const minAgeParam = searchParams.get('minAge')
  const maxAgeParam = searchParams.get('maxAge')
  const minAge = minAgeParam ? parseInt(minAgeParam, 10) : null
  const maxAge = maxAgeParam ? parseInt(maxAgeParam, 10) : null

  const lat = latParam ? parseFloat(latParam) : null
  const lng = lngParam ? parseFloat(lngParam) : null
  const radius = radiusParam ? parseFloat(radiusParam) : 100

  const cursor = cursorParam ? decodeCursor(cursorParam) : null
  const cursorCompleteness = cursor ? Math.round(cursor.score * 100) : 0
  const cursorWhere = cursor
    ? or(
        sql`${companionProfiles.profile_completeness} < ${cursorCompleteness}`,
        and(
          sql`${companionProfiles.profile_completeness} = ${cursorCompleteness}`,
          sql`${companionProfiles.id} > ${cursor.id}`
        )
      )
    : undefined

  // When lat/lng provided: include Haversine distance and filter by radius (for companions with location).
  // When no lat/lng (worldwide): return all visible companions.
  const useLocation = lat !== null && lng !== null

  const rows = await db
    .select({
      profileId: companionProfiles.id,
      companionId: companionProfiles.companion_id,
      score: sql<number>`${companionProfiles.profile_completeness} / 100.0`,
      tagline: companionProfiles.tagline,
      city: companionProfiles.city,
      currency: companionProfiles.currency,
      is_verified: companionProfiles.is_verified,
      session_modality: companionProfiles.session_modality,
      hourly_rate: companionProfiles.hourly_rate,
      // Haversine distance in km (null when companion has no location)
      distance_km: useLocation
        ? sql<number | null>`
            CASE WHEN ${companionProfiles.latitude} IS NOT NULL AND ${companionProfiles.longitude} IS NOT NULL
            THEN ROUND(
              6371 * 2 * ASIN(SQRT(
                POWER(SIN(RADIANS(${companionProfiles.latitude}::numeric - ${lat}) / 2), 2) +
                COS(RADIANS(${lat})) * COS(RADIANS(${companionProfiles.latitude}::numeric)) *
                POWER(SIN(RADIANS(${companionProfiles.longitude}::numeric - ${lng}) / 2), 2)
              ))
            ::numeric, 1)
            ELSE NULL END`
        : sql<null>`NULL`,
    })
    .from(companionProfiles)
    .where(
      and(
        eq(companionProfiles.is_visible_to_users, true),
        // Only surface profiles that have a WhatsApp number (required for the contact CTA)
        isNotNull(companionProfiles.whatsapp_number),
        // Location filter: when using location, only exclude companions that HAVE a location but are outside radius.
        // Companions with no location (latitude IS NULL) always pass through.
        useLocation
          ? sql`(
            ${companionProfiles.latitude} IS NULL OR
            6371 * 2 * ASIN(SQRT(
              POWER(SIN(RADIANS(${companionProfiles.latitude}::numeric - ${lat}) / 2), 2) +
              COS(RADIANS(${lat})) * COS(RADIANS(${companionProfiles.latitude}::numeric)) *
              POWER(SIN(RADIANS(${companionProfiles.longitude}::numeric - ${lng}) / 2), 2)
            )) <= ${radius}
          )`
          : undefined,
        gender
          ? sql`${companionProfiles.companion_id} IN (SELECT id FROM companions WHERE gender_community = ${gender})`
          : undefined,
        minAge
          ? sql`${companionProfiles.companion_id} IN (SELECT id FROM companions WHERE date_of_birth IS NOT NULL AND EXTRACT(YEAR FROM AGE(date_of_birth)) >= ${minAge})`
          : undefined,
        maxAge
          ? sql`${companionProfiles.companion_id} IN (SELECT id FROM companions WHERE date_of_birth IS NOT NULL AND EXTRACT(YEAR FROM AGE(date_of_birth)) <= ${maxAge})`
          : undefined,
        cursorWhere
      )
    )
    .orderBy(desc(companionProfiles.profile_completeness), asc(companionProfiles.id))
    .limit(LIMIT + 1)

  const pageRows = rows.slice(0, LIMIT)
  const hasNextPage = rows.length > LIMIT
  const profileIds = pageRows.map((r) => r.profileId)
  const companionIds = pageRows.map((r) => r.companionId)

  if (profileIds.length === 0) {
    return NextResponse.json({ items: [], nextCursor: null })
  }

  const [companionRows, photoRows, sessionCardRows, vibeTagRows] = await Promise.all([
    db
      .select({ id: companions.id, name: companions.name, date_of_birth: companions.date_of_birth, alias: companions.alias })
      .from(companions)
      .where(inArray(companions.id, companionIds)),

    db
      .select({
        companion_profile_id: companionPhotos.companion_profile_id,
        url: companionPhotos.url,
        is_primary: companionPhotos.is_primary,
      })
      .from(companionPhotos)
      .where(
        and(
          inArray(companionPhotos.companion_profile_id, profileIds),
          isNull(companionPhotos.deleted_at)
        )
      ),

    db
      .select({
        companion_profile_id: sessionCards.companion_profile_id,
        price: sessionCards.price,
        currency: sessionCards.currency,
      })
      .from(sessionCards)
      .where(
        and(inArray(sessionCards.companion_profile_id, profileIds), isNull(sessionCards.deleted_at))
      ),

    db
      .select({
        companion_profile_id: companionVibeTags.companion_profile_id,
        name: vibeTags.name,
      })
      .from(companionVibeTags)
      .innerJoin(vibeTags, eq(vibeTags.id, companionVibeTags.vibe_tag_id))
      .where(inArray(companionVibeTags.companion_profile_id, profileIds)),
  ])

  const companionMap = new Map(companionRows.map((c) => [c.id, c]))
  const photoMap = new Map<string, string | null>()
  for (const p of photoRows) {
    if (p.is_primary || !photoMap.has(p.companion_profile_id)) {
      photoMap.set(p.companion_profile_id, p.url)
    }
  }
  const minPriceMap = new Map<string, { price: string; currency: string }>()
  for (const sc of sessionCardRows) {
    if (!sc.price) continue
    const existing = minPriceMap.get(sc.companion_profile_id)
    if (!existing || parseFloat(sc.price) < parseFloat(existing.price)) {
      minPriceMap.set(sc.companion_profile_id, { price: sc.price, currency: sc.currency })
    }
  }
  const vibeTagMapByProfile = new Map<string, string[]>()
  for (const vt of vibeTagRows) {
    if (!vibeTagMapByProfile.has(vt.companion_profile_id))
      vibeTagMapByProfile.set(vt.companion_profile_id, [])
    const arr = vibeTagMapByProfile.get(vt.companion_profile_id)!
    if (arr.length < 3) arr.push(vt.name)
  }

  const items = pageRows.map((row) => {
    const comp = companionMap.get(row.companionId)
    const priceInfo = minPriceMap.get(row.profileId)
    const tags = vibeTagMapByProfile.get(row.profileId) ?? []
    const currency = row.currency ?? 'EUR'
    // Fall back to hourly_rate from companion_profiles when no session_cards exist
    // (companions registered via blushbite.live set hourly_rate directly)
    const minPrice = priceInfo
      ? `${currencySymbol(priceInfo.currency)}${Math.round(parseFloat(priceInfo.price))}`
      : row.hourly_rate
        ? `${currencySymbol(currency)}${Math.round(parseFloat(String(row.hourly_rate)))}`
        : null

    return {
      id: row.profileId,
      companionId: row.companionId,
      name: comp?.name ?? null,
      age: ageFromDob(comp?.date_of_birth ?? null),
      city: row.city ?? null,
      distance_km: row.distance_km ?? null,
      minPrice,
      currency,
      vibe: row.tagline ?? null,
      tags,
      primaryPhotoUrl: photoMap.get(row.profileId) ?? null,
      gradient: gradientFromId(row.profileId),
      isVerified: row.is_verified ?? false,
      sessionModality: row.session_modality ?? 'in_person',
      alias: comp?.alias ?? null,
    }
  })

  const lastItem = pageRows[pageRows.length - 1]
  const nextCursor =
    hasNextPage && lastItem ? encodeCursor(lastItem.score, lastItem.profileId) : null

  return NextResponse.json({ items, nextCursor })
}
