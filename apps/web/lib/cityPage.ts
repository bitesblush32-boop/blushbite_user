import { db } from '@/db'
import { companions, companionProfiles, companionPhotos } from '@/db/schema'
import { and, eq, isNull, desc, sql } from 'drizzle-orm'

export type CityCompanion = {
  profileId: string
  name: string | null
  age: number | null
  city: string | null
  tagline: string | null
  minRate: string | null
  photoUrl: string | null
  isVerified: boolean
  sessionModality: string
  alias: string | null
}

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function currencySymbol(code: string): string {
  const map: Record<string, string> = { EUR: '€', INR: '₹', USD: '$', GBP: '£' }
  return map[code] ?? code
}

export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function getCityCompanions(
  citySlug: string,
  genderCommunity: string
): Promise<CityCompanion[]> {
  const rows = await db
    .select({
      profileId: companionProfiles.id,
      companionId: companionProfiles.companion_id,
      city: companionProfiles.city,
      tagline: companionProfiles.tagline,
      hourly_rate: companionProfiles.hourly_rate,
      currency: companionProfiles.currency,
      is_verified: companionProfiles.is_verified,
      session_modality: companionProfiles.session_modality,
      name: companions.name,
      date_of_birth: companions.date_of_birth,
      alias: companions.alias,
    })
    .from(companionProfiles)
    .innerJoin(companions, eq(companionProfiles.companion_id, companions.id))
    .where(
      and(
        eq(companionProfiles.is_visible_to_users, true),
        sql`${companionProfiles.city_slug} = ${citySlug}`,
        sql`${companions.gender_community} = ${genderCommunity}`
      )
    )
    .orderBy(desc(companionProfiles.profile_completeness))
    .limit(48)

  if (rows.length === 0) return []

  const profileIds = rows.map((r) => r.profileId)
  const photoRows = await db
    .select({ companion_profile_id: companionPhotos.companion_profile_id, url: companionPhotos.url, is_primary: companionPhotos.is_primary })
    .from(companionPhotos)
    .where(and(
      sql`${companionPhotos.companion_profile_id} = ANY(ARRAY[${sql.join(profileIds.map(id => sql`${id}::uuid`), sql`, `)}])`,
      isNull(companionPhotos.deleted_at)
    ))

  const photoMap = new Map<string, string>()
  for (const p of photoRows) {
    if (p.is_primary || !photoMap.has(p.companion_profile_id)) {
      photoMap.set(p.companion_profile_id, p.url)
    }
  }

  return rows.map((r) => {
    const currency = r.currency ?? 'EUR'
    const minRate = r.hourly_rate
      ? `${currencySymbol(currency)}${Math.round(parseFloat(String(r.hourly_rate)))}`
      : null
    return {
      profileId: r.profileId,
      name: r.name ?? null,
      age: ageFromDob(r.date_of_birth ?? null),
      city: r.city ?? null,
      tagline: r.tagline ?? null,
      minRate,
      photoUrl: photoMap.get(r.profileId) ?? null,
      isVerified: r.is_verified ?? false,
      sessionModality: r.session_modality ?? 'in_person',
      alias: r.alias ?? null,
    }
  })
}

export async function getCitySlugsForGender(genderCommunity: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ city_slug: companionProfiles.city_slug })
    .from(companionProfiles)
    .innerJoin(companions, eq(companionProfiles.companion_id, companions.id))
    .where(
      and(
        eq(companionProfiles.is_visible_to_users, true),
        sql`${companions.gender_community} = ${genderCommunity}`,
        sql`${companionProfiles.city_slug} IS NOT NULL`
      )
    )
  return rows.filter((r) => r.city_slug).map((r) => r.city_slug!)
}
