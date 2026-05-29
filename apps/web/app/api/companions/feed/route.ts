import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  users, companions, companionProfiles, companionPhotos,
  sessionCards, companionVibeTags, vibeTags,
  fantasyTagOverlapScores, userFantasyTags,
} from '@/db/schema'
import { eq, and, isNull, asc, desc, inArray, sql, or, lt, gt } from 'drizzle-orm'
import { computeOverlapScores } from '@/lib/recommendations'

const LIMIT = 12

export interface CompanionFeedItem {
  id:               string   // companion_profiles.id
  companionId:      string   // companions.id
  name:             string | null
  age:              number | null
  city:             string | null
  minPrice:         string | null  // e.g. "€280"
  currency:         string
  vibe:             string | null  // tagline
  tags:             string[]       // top 3 vibe_tag names
  primaryPhotoUrl:  string | null
  gradient:         string         // assigned from id hash % 6
  isVerified:       boolean
  sessionModality:  string
  overlapScore:     number         // 0–1
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
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'))
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursorParam = searchParams.get('cursor')
  const cursor = cursorParam ? decodeCursor(cursorParam) : null

  // Get authenticated user
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1)

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Check if user has fantasy tags set
  const userTagRows = await db
    .select({ fantasy_tag_id: userFantasyTags.fantasy_tag_id })
    .from(userFantasyTags)
    .where(eq(userFantasyTags.user_id, user.id))

  const hasTags = userTagRows.length > 0

  const scoreExpr = hasTags
    ? sql<number>`CAST(ftos.overlap_score AS NUMERIC) * 0.70 + (${companionProfiles.profile_completeness} / 100.0) * 0.30`
    : sql<number>`${companionProfiles.profile_completeness} / 100.0`

  let profileRows: { profileId: string; companionId: string; score: number }[]

  if (hasTags) {
    // Check if overlap scores exist for this user
    const [existingScore] = await db
      .select({ id: fantasyTagOverlapScores.id })
      .from(fantasyTagOverlapScores)
      .where(eq(fantasyTagOverlapScores.user_id, user.id))
      .limit(1)

    if (!existingScore) {
      // Compute scores lazily for all visible companions
      const visibleProfiles = await db
        .select({ id: companionProfiles.id })
        .from(companionProfiles)
        .where(eq(companionProfiles.is_visible_to_users, true))
      const profileIds = visibleProfiles.map(p => p.id)
      if (profileIds.length > 0) {
        await computeOverlapScores(user.id, profileIds)
      }
    }

    // Build cursor condition
    const cursorWhere = cursor
      ? or(
          lt(scoreExpr, cursor.score),
          and(sql`${scoreExpr} = ${cursor.score}`, gt(companionProfiles.id, cursor.id))
        )
      : undefined

    const rows = await db
      .select({
        profileId: companionProfiles.id,
        companionId: companionProfiles.companion_id,
        score: scoreExpr,
      })
      .from(fantasyTagOverlapScores)
      .innerJoin(companionProfiles, eq(companionProfiles.id, fantasyTagOverlapScores.companion_profile_id))
      .where(and(
        eq(fantasyTagOverlapScores.user_id, user.id),
        eq(companionProfiles.is_visible_to_users, true),
        cursorWhere,
      ))
      .orderBy(desc(scoreExpr), asc(companionProfiles.id))
      .limit(LIMIT + 1)

    profileRows = rows.map(r => ({ profileId: r.profileId, companionId: r.companionId, score: Number(r.score) }))
  } else {
    // Fallback: order by completeness DESC for users with no tags
    const cursorWhere = cursor
      ? or(
          lt(companionProfiles.profile_completeness, Math.round(cursor.score * 100)),
          and(
            eq(companionProfiles.profile_completeness, Math.round(cursor.score * 100)),
            gt(companionProfiles.id, cursor.id)
          )
        )
      : undefined

    const rows = await db
      .select({
        profileId: companionProfiles.id,
        companionId: companionProfiles.companion_id,
        score: sql<number>`${companionProfiles.profile_completeness} / 100.0`,
      })
      .from(companionProfiles)
      .where(and(eq(companionProfiles.is_visible_to_users, true), cursorWhere))
      .orderBy(desc(companionProfiles.profile_completeness), asc(companionProfiles.id))
      .limit(LIMIT + 1)

    profileRows = rows.map(r => ({ profileId: r.profileId, companionId: r.companionId, score: Number(r.score) }))
  }

  // Pagination
  const hasNextPage = profileRows.length > LIMIT
  const pageRows = profileRows.slice(0, LIMIT)
  const profileIds = pageRows.map(r => r.profileId)
  const companionIds = pageRows.map(r => r.companionId)

  if (profileIds.length === 0) {
    return NextResponse.json({ items: [], nextCursor: null })
  }

  // Batch-load supplementary data
  const [companionRows, photoRows, sessionCardRows, vibeTagRows] = await Promise.all([
    db.select({
      id: companions.id, name: companions.name, date_of_birth: companions.date_of_birth,
    }).from(companions).where(inArray(companions.id, companionIds)),

    db.select({
      companion_profile_id: companionPhotos.companion_profile_id,
      url: companionPhotos.url, is_primary: companionPhotos.is_primary,
    }).from(companionPhotos)
      .where(and(inArray(companionPhotos.companion_profile_id, profileIds), isNull(companionPhotos.deleted_at))),

    db.select({
      companion_profile_id: sessionCards.companion_profile_id,
      price: sessionCards.price, currency: sessionCards.currency,
    }).from(sessionCards)
      .where(and(inArray(sessionCards.companion_profile_id, profileIds), isNull(sessionCards.deleted_at))),

    db.select({
      companion_profile_id: companionVibeTags.companion_profile_id,
      name: vibeTags.name,
    }).from(companionVibeTags)
      .innerJoin(vibeTags, eq(vibeTags.id, companionVibeTags.vibe_tag_id))
      .where(inArray(companionVibeTags.companion_profile_id, profileIds)),
  ])

  // Also load profile details we need
  const profileDetailRows = await db
    .select({
      id: companionProfiles.id,
      companion_id: companionProfiles.companion_id,
      tagline: companionProfiles.tagline,
      city: companionProfiles.city,
      currency: companionProfiles.currency,
      is_verified: companionProfiles.is_verified,
      session_modality: companionProfiles.session_modality,
    })
    .from(companionProfiles)
    .where(inArray(companionProfiles.id, profileIds))

  // Index maps for O(1) lookups
  const companionMap = new Map(companionRows.map(c => [c.id, c]))
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
  const vibeTagMap = new Map<string, string[]>()
  for (const vt of vibeTagRows) {
    if (!vibeTagMap.has(vt.companion_profile_id)) vibeTagMap.set(vt.companion_profile_id, [])
    const arr = vibeTagMap.get(vt.companion_profile_id)!
    if (arr.length < 3) arr.push(vt.name)
  }
  const profileDetailMap = new Map(profileDetailRows.map(p => [p.id, p]))

  // Build response items preserving order
  const items: CompanionFeedItem[] = pageRows.map(row => {
    const profile = profileDetailMap.get(row.profileId)
    const comp = companionMap.get(row.companionId)
    const priceInfo = minPriceMap.get(row.profileId)

    const minPrice = priceInfo
      ? `${priceInfo.currency === 'EUR' ? '€' : priceInfo.currency}${Math.round(parseFloat(priceInfo.price))}`
      : null

    return {
      id:              row.profileId,
      companionId:     row.companionId,
      name:            comp?.name ?? null,
      age:             ageFromDob(comp?.date_of_birth ?? null),
      city:            profile?.city ?? null,
      minPrice,
      currency:        profile?.currency ?? 'EUR',
      vibe:            profile?.tagline ?? null,
      tags:            vibeTagMap.get(row.profileId) ?? [],
      primaryPhotoUrl: photoMap.get(row.profileId) ?? null,
      gradient:        gradientFromId(row.profileId),
      isVerified:      profile?.is_verified ?? false,
      sessionModality: profile?.session_modality ?? 'in_person',
      overlapScore:    row.score,
    }
  })

  const lastItem = pageRows[pageRows.length - 1]
  const nextCursor = hasNextPage && lastItem
    ? encodeCursor(lastItem.score, lastItem.profileId)
    : null

  return NextResponse.json({ items, nextCursor })
}
