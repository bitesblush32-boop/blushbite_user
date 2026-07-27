import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { companionBoosts, companions, companionProfiles, companionPhotos } from '@/db/schema'
import { and, eq, isNull, inArray, lte, gte, sql } from 'drizzle-orm'

const VALID_COMMUNITIES = ['female', 'male', 'shemale']

function currencySymbol(code: string): string {
  const map: Record<string, string> = { EUR: '€', INR: '₹', USD: '$', GBP: '£' }
  return map[code] ?? code
}

export interface ActiveBoostItem {
  id: string
  boost_type: string
  companion_id: string | null
  companion_name: string | null
  companion_tagline: string | null
  companion_city: string | null
  companion_photo_url: string | null
  companion_min_rate: string | null
  companion_is_verified: boolean
  banner_image_url: string | null
  banner_headline: string | null
  banner_tagline_text: string | null
}

export async function GET(req: NextRequest) {
  const community = req.nextUrl.searchParams.get('community')
  if (!community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json([], { status: 200 })
  }

  const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

  // Query active boosts for this community in the current week, joined with companion + profile
  const boostRows = await db
    .select({
      id: companionBoosts.id,
      boost_type: companionBoosts.boost_type,
      companion_id: companionBoosts.companion_id,
      banner_image_url: companionBoosts.banner_image_url,
      banner_headline: companionBoosts.banner_headline,
      banner_tagline: companionBoosts.banner_tagline,
      companion_name: companions.name,
      profile_id: companionProfiles.id,
      companion_tagline: companionProfiles.tagline,
      companion_city: companionProfiles.city,
      companion_hourly_rate: companionProfiles.hourly_rate,
      companion_currency: companionProfiles.currency,
      companion_is_verified: companionProfiles.is_verified,
    })
    .from(companionBoosts)
    .innerJoin(companions, eq(companions.id, companionBoosts.companion_id))
    .leftJoin(companionProfiles, eq(companionProfiles.companion_id, companions.id))
    .where(
      and(
        eq(companionBoosts.community, community),
        eq(companionBoosts.status, 'active'),
        eq(companionBoosts.is_enabled, true),
        lte(companionBoosts.week_start, today),
        gte(companionBoosts.week_end, today)
      )
    )
    .orderBy(companionBoosts.boost_type)

  if (boostRows.length === 0) {
    return NextResponse.json([])
  }

  // Batch-fetch primary photos for all companion profiles
  const profileIds = boostRows.map((r) => r.profile_id).filter((id): id is string => !!id)
  const photoRows =
    profileIds.length > 0
      ? await db
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
          )
      : []

  // Build photo map: profile_id → primary photo url (first is_primary, else first any)
  const photoMap = new Map<string, string>()
  for (const p of photoRows) {
    if (p.is_primary || !photoMap.has(p.companion_profile_id)) {
      photoMap.set(p.companion_profile_id, p.url)
    }
  }

  const items: ActiveBoostItem[] = boostRows.map((r) => {
    const currency = r.companion_currency ?? 'EUR'
    const rate = r.companion_hourly_rate
      ? `${currencySymbol(currency)}${Math.round(parseFloat(String(r.companion_hourly_rate)))}`
      : null

    return {
      id: r.id,
      boost_type: r.boost_type,
      companion_id: r.companion_id,
      companion_name: r.companion_name ?? null,
      companion_tagline: r.companion_tagline ?? null,
      companion_city: r.companion_city ?? null,
      companion_photo_url: r.profile_id ? (photoMap.get(r.profile_id) ?? null) : null,
      companion_min_rate: rate,
      companion_is_verified: r.companion_is_verified ?? false,
      banner_image_url: r.banner_image_url ?? null,
      banner_headline: r.banner_headline ?? null,
      banner_tagline_text: r.banner_tagline ?? null,
    }
  })

  return NextResponse.json(items)
}
