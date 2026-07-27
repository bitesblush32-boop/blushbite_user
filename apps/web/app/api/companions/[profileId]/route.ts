import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import {
  companions,
  companionProfiles,
  companionPhotos,
  companionVideos,
  sessionCards,
  companionVibeTags,
  vibeTags,
} from '@/db/schema'
import { eq, and, isNull, asc } from 'drizzle-orm'

function sym(code: string): string {
  const map: Record<string, string> = { EUR: '€', INR: '₹', USD: '$', GBP: '£' }
  return map[code] ?? code
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

export async function GET(_req: NextRequest, { params }: { params: { profileId: string } }) {
  const { profileId } = params

  let profile:
    | {
        id: string
        companion_id: string
        bio: string | null
        tagline: string | null
        city: string | null
        currency: string
        hourly_rate: string | null
        is_verified: boolean | null
        session_modality: string | null
        is_visible_to_users: boolean | null
        whatsapp_number: string | null
        telegram_handle: string | null
      }
    | undefined

  try {
    ;[profile] = await db
      .select({
        id: companionProfiles.id,
        companion_id: companionProfiles.companion_id,
        bio: companionProfiles.bio,
        tagline: companionProfiles.tagline,
        city: companionProfiles.city,
        currency: companionProfiles.currency,
        hourly_rate: companionProfiles.hourly_rate,
        is_verified: companionProfiles.is_verified,
        session_modality: companionProfiles.session_modality,
        is_visible_to_users: companionProfiles.is_visible_to_users,
        whatsapp_number: companionProfiles.whatsapp_number,
        telegram_handle: companionProfiles.telegram_handle,
      })
      .from(companionProfiles)
      .where(eq(companionProfiles.id, profileId))
      .limit(1)
  } catch (err) {
    console.error('[companions/profileId] DB error (profile lookup):', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }

  // Hidden until companion has a WhatsApp number (needed for the contact CTA)
  if (!profile || !profile.is_visible_to_users || !profile.whatsapp_number) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let companionRow: { id: string; name: string | null; date_of_birth: string | null } | null
  let photoRows: { url: string; is_primary: boolean | null; sort_order: number | null }[]
  let videoRows: {
    id: string
    url: string
    thumbnail_url: string | null
    duration_seconds: number | null
  }[]
  let sessionCardRows: {
    id: string
    title: string
    description: string | null
    price: string | null
    currency: string | null
    session_type: string | null
    duration_minutes: number | null
  }[]
  let vibeTagRows: { name: string }[]

  try {
    ;[companionRow, photoRows, videoRows, sessionCardRows, vibeTagRows] = await Promise.all([
      db
        .select({
          id: companions.id,
          name: companions.name,
          date_of_birth: companions.date_of_birth,
        })
        .from(companions)
        .where(eq(companions.id, profile.companion_id))
        .limit(1)
        .then((r) => r[0] ?? null),

      db
        .select({
          url: companionPhotos.url,
          is_primary: companionPhotos.is_primary,
          sort_order: companionPhotos.sort_order,
        })
        .from(companionPhotos)
        .where(
          and(
            eq(companionPhotos.companion_profile_id, profileId),
            eq(companionPhotos.is_approved, true),
            isNull(companionPhotos.deleted_at)
          )
        )
        .orderBy(asc(companionPhotos.sort_order)),

      db
        .select({
          id: companionVideos.id,
          url: companionVideos.url,
          thumbnail_url: companionVideos.thumbnail_url,
          duration_seconds: companionVideos.duration_seconds,
        })
        .from(companionVideos)
        .where(
          and(
            eq(companionVideos.companion_profile_id, profileId),
            eq(companionVideos.is_approved, true),
            isNull(companionVideos.deleted_at)
          )
        ),

      db
        .select({
          id: sessionCards.id,
          title: sessionCards.title,
          description: sessionCards.description,
          price: sessionCards.price,
          currency: sessionCards.currency,
          session_type: sessionCards.session_type,
          duration_minutes: sessionCards.duration_minutes,
        })
        .from(sessionCards)
        .where(
          and(
            eq(sessionCards.companion_profile_id, profileId),
            eq(sessionCards.is_active, true),
            isNull(sessionCards.deleted_at)
          )
        )
        .orderBy(asc(sessionCards.sort_order)),

      db
        .select({ name: vibeTags.name })
        .from(companionVibeTags)
        .innerJoin(vibeTags, eq(vibeTags.id, companionVibeTags.vibe_tag_id))
        .where(eq(companionVibeTags.companion_profile_id, profileId)),
    ])
  } catch (err) {
    console.error('[companions/profileId] DB error (detail queries):', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }

  // Gate: must have ≥1 approved photo
  if (photoRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const primaryPhoto = photoRows.find((p) => p.is_primary)?.url ?? photoRows[0]?.url ?? null
  const currency = profile.currency ?? 'EUR'
  const currSym = sym(currency)

  // Fall back to hourly_rate from companion_profiles when no session_cards exist
  // (companions registered via blushbite.live set hourly_rate directly, not session_cards)
  const minPrice =
    sessionCardRows.length > 0
      ? `${currSym}${Math.round(
          parseFloat(
            sessionCardRows.reduce(
              (min, sc) =>
                sc.price && parseFloat(sc.price) < parseFloat(min.price ?? '9999') ? sc : min,
              sessionCardRows[0]
            ).price ?? '0'
          )
        )}`
      : profile.hourly_rate
        ? `${currSym}${Math.round(parseFloat(String(profile.hourly_rate)))}`
        : null

  return NextResponse.json({
    id: profile.id,
    companionId: profile.companion_id,
    name: companionRow?.name ?? null,
    age: ageFromDob(companionRow?.date_of_birth ?? null),
    city: profile.city,
    bio: profile.bio,
    tagline: profile.tagline,
    minPrice,
    currency,
    isVerified: profile.is_verified,
    sessionModality: profile.session_modality,
    gradient: gradientFromId(profile.id),
    primaryPhotoUrl: primaryPhoto,
    photoUrls: photoRows.map((p) => p.url),
    whatsappNumber: profile.whatsapp_number ?? null,
    telegramHandle: profile.telegram_handle ?? null,
    videos: videoRows.map((v) => ({
      id: v.id,
      url: v.url,
      thumbnailUrl: v.thumbnail_url,
      durationSeconds: v.duration_seconds,
    })),
    tags: vibeTagRows.map((v) => v.name),
    sessionCards: sessionCardRows.map((sc) => ({
      id: sc.id,
      title: sc.title,
      description: sc.description,
      price: sc.price ? `${currSym}${Math.round(parseFloat(sc.price))}` : null,
      sessionType: sc.session_type,
      durationMinutes: sc.duration_minutes,
    })),
  })
}
