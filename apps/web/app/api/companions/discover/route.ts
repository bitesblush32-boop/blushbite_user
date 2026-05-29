import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  users, userProfiles, companions, companionProfiles, companionPhotos,
  sessionCards, companionVibeTags, vibeTags,
  fantasyTagOverlapScores, userFantasyTags, fantasyTags,
} from '@/db/schema'
import { eq, and, isNull, asc, desc, inArray, sql, or, gte, lte } from 'drizzle-orm'
import { computeOverlapScores } from '@/lib/recommendations'
import { VIBE_TO_TAG_SLUGS, DESIRED_GENDER_MAP, INTENSE_VIBE_NAMES, GENTLE_VIBE_NAMES } from '@/lib/vibeTagMap'

const LIMIT = 12

export interface DiscoverCompanionItem {
  id:              string
  companionId:     string
  name:            string | null
  age:             number | null
  city:            string | null
  minPrice:        string | null
  currency:        string
  vibe:            string | null
  tags:            string[]
  primaryPhotoUrl: string | null
  gradient:        string
  isVerified:      boolean
  sessionModality: string
  overlapScore:    number
  distance_km:     number | null
  gender:          string | null
  height_cm:       number | null
  body_type:       string | null
}

const GRADIENTS = [
  'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)',
  'linear-gradient(135deg,#0f1a28,#1f2840,#2a1020)',
  'linear-gradient(135deg,#201228,#1a2030,#2a1a18)',
  'linear-gradient(135deg,#0a1620,#1a1535,#201a10)',
  'linear-gradient(135deg,#1a1020,#2a1530,#101820)',
  'linear-gradient(135deg,#101820,#201028,#102020)',
]

function gradientFromId(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

function encodeCursor(score: number, id: string): string {
  return Buffer.from(JSON.stringify({ score, id })).toString('base64')
}

function decodeCursor(cursor: string): { score: number; id: string } | null {
  try { return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) }
  catch { return null }
}

// Distance score: 1 at 0km, 0.5 at 7km, approaches 0 asymptotically
function distanceScore(km: number): number {
  return 1 / (1 + km * 0.1)
}

async function bootstrapTagsFromVibes(userId: string, vibes: string[]): Promise<void> {
  try {
    const slugs = vibes.flatMap(v => VIBE_TO_TAG_SLUGS[v] ?? [])
    if (!slugs.length) return
    const tagRows = await db.select({ id: fantasyTags.id, slug: fantasyTags.slug })
      .from(fantasyTags).where(inArray(fantasyTags.slug, slugs))
    if (!tagRows.length) return
    const seen = new Set<number>()
    const toInsert = tagRows.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
      .map(t => ({ user_id: userId, fantasy_tag_id: t.id, intensity: 'curious' as const, source: 'vibe_map' as const }))
    if (toInsert.length) await db.insert(userFantasyTags).values(toInsert).onConflictDoNothing()
  } catch { /* non-fatal */ }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const latParam    = searchParams.get('lat')
  const lngParam    = searchParams.get('lng')
  const radiusParam = searchParams.get('radius')
  const cursorParam = searchParams.get('cursor')

  const userLat    = latParam    ? parseFloat(latParam)    : null
  const userLng    = lngParam    ? parseFloat(lngParam)    : null
  const radiusKm   = Math.min(radiusParam ? parseFloat(radiusParam) : 100, 500)
  const cursor     = cursorParam ? decodeCursor(cursorParam) : null
  const hasLocation = userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)

  // Auth user + profile
  const [userRow] = await db.select({
    id:              users.id,
    vibes:           userProfiles.vibes,
    desired_genders: userProfiles.desired_genders,
    mood_intensity:  userProfiles.mood_intensity,
  })
  .from(users)
  .leftJoin(userProfiles, eq(userProfiles.user_id, users.id))
  .where(eq(users.email, session.user.email))
  .limit(1)

  if (!userRow) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const userId       = userRow.id
  const moodIntensity = userRow.mood_intensity ?? 50

  // Gender filter
  const desiredGenders  = (userRow.desired_genders as string[] | null) ?? []
  const allowedGenders  = desiredGenders.map(g => DESIRED_GENDER_MAP[g]).filter(Boolean)
  const genderWhere     = allowedGenders.length > 0 ? inArray(companionProfiles.gender, allowedGenders) : undefined

  // User fantasy tags + bootstrap
  let userTagRows = await db.select({ fantasy_tag_id: userFantasyTags.fantasy_tag_id })
    .from(userFantasyTags).where(eq(userFantasyTags.user_id, userId))
  if (userTagRows.length === 0 && Array.isArray(userRow.vibes) && (userRow.vibes as string[]).length > 0) {
    await bootstrapTagsFromVibes(userId, userRow.vibes as string[])
    userTagRows = await db.select({ fantasy_tag_id: userFantasyTags.fantasy_tag_id })
      .from(userFantasyTags).where(eq(userFantasyTags.user_id, userId))
  }
  const hasTags = userTagRows.length > 0

  // ── Bounding box for location filter ──────────────────────────────────────
  const DEG_PER_KM = 1 / 111
  const latDelta   = radiusKm * DEG_PER_KM
  const lngDelta   = hasLocation ? radiusKm * DEG_PER_KM / Math.cos((userLat! * Math.PI) / 180) : 0

  const locationWhere = hasLocation
    ? and(
        gte(companionProfiles.latitude,  sql`${userLat! - latDelta}`),
        lte(companionProfiles.latitude,  sql`${userLat! + latDelta}`),
        gte(companionProfiles.longitude, sql`${userLng! - lngDelta}`),
        lte(companionProfiles.longitude, sql`${userLng! + lngDelta}`),
      )
    : undefined

  // ── Haversine distance expression ─────────────────────────────────────────
  const haversineExpr = hasLocation
    ? sql<number>`
        6371.0 * 2 * ASIN(SQRT(
          POWER(SIN((RADIANS(${companionProfiles.latitude}) - RADIANS(${userLat!})) / 2), 2)
          + COS(RADIANS(${userLat!})) * COS(RADIANS(${companionProfiles.latitude}))
          * POWER(SIN((RADIANS(${companionProfiles.longitude}) - RADIANS(${userLng!})) / 2), 2)
        ))
      `
    : sql<number>`NULL`

  // ── Score expression ───────────────────────────────────────────────────────
  // With location: 60% overlap + 40% distance; without: 70% overlap + 30% completeness
  const overlapCol = hasTags
    ? sql<number>`CAST(${fantasyTagOverlapScores.overlap_score} AS NUMERIC)`
    : sql<number>`(${companionProfiles.profile_completeness} / 100.0)`

  const scoreExpr = hasLocation
    ? hasTags
      ? sql<number>`${overlapCol} * 0.60 + (1.0 / (1.0 + ${haversineExpr} * 0.1)) * 0.40`
      : sql<number>`(${companionProfiles.profile_completeness} / 100.0) * 0.60 + (1.0 / (1.0 + ${haversineExpr} * 0.1)) * 0.40`
    : hasTags
      ? sql<number>`${overlapCol} * 0.70 + (${companionProfiles.profile_completeness} / 100.0) * 0.30`
      : sql<number>`${companionProfiles.profile_completeness} / 100.0`

  const cursorWhere = cursor
    ? or(
        sql`${scoreExpr} < ${cursor.score}`,
        and(sql`${scoreExpr} = ${cursor.score}`, sql`${companionProfiles.id} > ${cursor.id}`)
      )
    : undefined

  let profileRows: { profileId: string; companionId: string; score: number; distance_km: number | null }[]

  if (hasTags) {
    // Ensure overlap scores exist
    const [existingScore] = await db.select({ id: fantasyTagOverlapScores.id })
      .from(fantasyTagOverlapScores)
      .where(eq(fantasyTagOverlapScores.user_id, userId))
      .limit(1)
    if (!existingScore) {
      const visible = await db.select({ id: companionProfiles.id }).from(companionProfiles)
        .where(and(eq(companionProfiles.is_visible_to_users, true), genderWhere, locationWhere))
      if (visible.length) await computeOverlapScores(userId, visible.map(p => p.id))
    }

    const rows = await db.select({
      profileId:   companionProfiles.id,
      companionId: companionProfiles.companion_id,
      score:       scoreExpr,
      distance_km: haversineExpr,
    })
    .from(fantasyTagOverlapScores)
    .innerJoin(companionProfiles, eq(companionProfiles.id, fantasyTagOverlapScores.companion_profile_id))
    .where(and(
      eq(fantasyTagOverlapScores.user_id, userId),
      eq(companionProfiles.is_visible_to_users, true),
      genderWhere,
      locationWhere,
      cursorWhere,
    ))
    .orderBy(desc(scoreExpr), asc(companionProfiles.id))
    .limit(LIMIT + 1)

    profileRows = rows.map(r => ({
      profileId:   r.profileId,
      companionId: r.companionId,
      score:       Number(r.score),
      distance_km: r.distance_km !== null ? Number(r.distance_km) : null,
    }))
  } else {
    const rows = await db.select({
      profileId:   companionProfiles.id,
      companionId: companionProfiles.companion_id,
      score:       scoreExpr,
      distance_km: haversineExpr,
    })
    .from(companionProfiles)
    .where(and(eq(companionProfiles.is_visible_to_users, true), genderWhere, locationWhere, cursorWhere))
    .orderBy(desc(scoreExpr), asc(companionProfiles.id))
    .limit(LIMIT + 1)

    profileRows = rows.map(r => ({
      profileId:   r.profileId,
      companionId: r.companionId,
      score:       Number(r.score),
      distance_km: r.distance_km !== null ? Number(r.distance_km) : null,
    }))
  }

  const hasNextPage = profileRows.length > LIMIT
  const pageRows    = profileRows.slice(0, LIMIT)
  const profileIds  = pageRows.map(r => r.profileId)
  const companionIds = pageRows.map(r => r.companionId)

  if (!profileIds.length) return NextResponse.json({ items: [], nextCursor: null })

  const [companionRows, photoRows, sessionCardRows, vibeTagRows, profileDetailRows] = await Promise.all([
    db.select({ id: companions.id, name: companions.name, date_of_birth: companions.date_of_birth })
      .from(companions).where(inArray(companions.id, companionIds)),

    db.select({ companion_profile_id: companionPhotos.companion_profile_id, url: companionPhotos.url, is_primary: companionPhotos.is_primary })
      .from(companionPhotos)
      .where(and(inArray(companionPhotos.companion_profile_id, profileIds), isNull(companionPhotos.deleted_at))),

    db.select({ companion_profile_id: sessionCards.companion_profile_id, price: sessionCards.price, currency: sessionCards.currency })
      .from(sessionCards)
      .where(and(inArray(sessionCards.companion_profile_id, profileIds), isNull(sessionCards.deleted_at))),

    db.select({ companion_profile_id: companionVibeTags.companion_profile_id, name: vibeTags.name })
      .from(companionVibeTags)
      .innerJoin(vibeTags, eq(vibeTags.id, companionVibeTags.vibe_tag_id))
      .where(inArray(companionVibeTags.companion_profile_id, profileIds)),

    db.select({
      id:               companionProfiles.id,
      companion_id:     companionProfiles.companion_id,
      tagline:          companionProfiles.tagline,
      city:             companionProfiles.city,
      currency:         companionProfiles.currency,
      is_verified:      companionProfiles.is_verified,
      session_modality: companionProfiles.session_modality,
      gender:           companionProfiles.gender,
      height_cm:        companionProfiles.height_cm,
      body_type:        companionProfiles.body_type,
    }).from(companionProfiles).where(inArray(companionProfiles.id, profileIds)),
  ])

  const companionMap = new Map(companionRows.map(c => [c.id, c]))
  const photoMap     = new Map<string, string | null>()
  for (const p of photoRows) {
    if (p.is_primary || !photoMap.has(p.companion_profile_id)) photoMap.set(p.companion_profile_id, p.url)
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
    if (!vibeTagMapByProfile.has(vt.companion_profile_id)) vibeTagMapByProfile.set(vt.companion_profile_id, [])
    const arr = vibeTagMapByProfile.get(vt.companion_profile_id)!
    if (arr.length < 3) arr.push(vt.name)
  }
  const profileDetailMap = new Map(profileDetailRows.map(p => [p.id, p]))

  let items: (DiscoverCompanionItem & { _rawScore: number })[] = pageRows.map(row => {
    const profile  = profileDetailMap.get(row.profileId)
    const comp     = companionMap.get(row.companionId)
    const priceInfo = minPriceMap.get(row.profileId)
    const tags     = vibeTagMapByProfile.get(row.profileId) ?? []

    const minPrice = priceInfo
      ? `${priceInfo.currency === 'EUR' ? '€' : priceInfo.currency}${Math.round(parseFloat(priceInfo.price))}`
      : null

    let moodBoost = 0
    if (moodIntensity > 70 && tags.some(t => INTENSE_VIBE_NAMES.has(t))) moodBoost = 0.05
    if (moodIntensity < 30 && tags.some(t => GENTLE_VIBE_NAMES.has(t))) moodBoost = 0.05

    return {
      id:              row.profileId,
      companionId:     row.companionId,
      name:            comp?.name ?? null,
      age:             ageFromDob(comp?.date_of_birth ?? null),
      city:            profile?.city ?? null,
      minPrice,
      currency:        profile?.currency ?? 'EUR',
      vibe:            profile?.tagline ?? null,
      tags,
      primaryPhotoUrl: photoMap.get(row.profileId) ?? null,
      gradient:        gradientFromId(row.profileId),
      isVerified:      profile?.is_verified ?? false,
      sessionModality: profile?.session_modality ?? 'in_person',
      overlapScore:    row.score,
      distance_km:     row.distance_km !== null ? Math.round(row.distance_km * 10) / 10 : null,
      gender:          profile?.gender ?? null,
      height_cm:       profile?.height_cm ?? null,
      body_type:       profile?.body_type ?? null,
      _rawScore:       row.score + moodBoost,
    }
  })

  if (moodIntensity > 70 || moodIntensity < 30) {
    items.sort((a, b) => b._rawScore - a._rawScore)
  }

  const lastItem  = pageRows[pageRows.length - 1]
  const nextCursor = hasNextPage && lastItem ? encodeCursor(lastItem.score, lastItem.profileId) : null

  return NextResponse.json({
    items: items.map(({ _rawScore: _, ...rest }) => rest),
    nextCursor,
  })
}
