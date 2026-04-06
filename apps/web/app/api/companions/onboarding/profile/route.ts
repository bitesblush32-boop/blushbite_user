import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  companions, companionProfiles, companionPhotos, companionVideos,
  companionFantasyTags, companionVibeTags, companionLanguages,
  sessionCards, companionOnboardingProgress,
  vibeTags, languages, fantasyTags,
} from '@/db/schema'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { z } from 'zod'

const DURATION_MAP: Record<string, number | null> = {
  '30min': 30, '1h': 60, '2h': 120, 'halfday': 240, 'fullday': 480, 'custom': null,
}

function minutesToKey(m: number | null): string {
  if (!m) return 'custom'
  const map: Record<number, string> = { 30: '30min', 60: '1h', 120: '2h', 240: 'halfday', 480: 'fullday' }
  return map[m] ?? 'custom'
}

const cardSchema = z.object({
  title:       z.string().min(1),
  sessionType: z.enum(['in_person', 'audio_call', 'video_call', 'chat', 'custom']),
  durationKey: z.string(),
  price:       z.number().nullable(),
  currency:    z.enum(['EUR', 'USD', 'GBP']),
  description: z.string().max(200).optional(),
})

const bodySchema = z.object({
  fullName:        z.string().min(1),
  dateOfBirth:     z.string().min(1),
  country:         z.string().min(1),
  displayName:     z.string().min(1),
  tagline:         z.string().max(80).optional(),
  bio:             z.string().max(500).optional(),
  city:            z.string().min(1),
  availability:    z.enum(['available', 'busy', 'offline']),
  fantasyTagIds:   z.array(z.number()).min(3).max(7),
  vibeTagNames:    z.array(z.string()).min(3).max(5),
  languageCodes:   z.array(z.string()).min(1),
  sessionCards:    z.array(cardSchema).min(2),
  photos:          z.array(z.object({ url: z.string(), s3Key: z.string() })).min(3),
  video:           z.object({ url: z.string(), s3Key: z.string(), durationSeconds: z.number() }).nullable().optional(),
  defaultCurrency: z.enum(['EUR', 'USD', 'GBP']),
})

// ─── GET /api/companions/onboarding/profile ───────────────────────────────────

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({ where: eq(companions.email, session.user.email) })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companion.id),
  })
  if (!profile) return NextResponse.json({ draft: null })

  const [fantRows, vibeRows, langRows, cardRows, photoRows, videoRows] = await Promise.all([
    db.select({ fantasy_tag_id: companionFantasyTags.fantasy_tag_id })
      .from(companionFantasyTags).where(eq(companionFantasyTags.companion_profile_id, profile.id)),
    db.select({ vibe_tag_id: companionVibeTags.vibe_tag_id })
      .from(companionVibeTags).where(eq(companionVibeTags.companion_profile_id, profile.id)),
    db.select({ language_id: companionLanguages.language_id })
      .from(companionLanguages).where(eq(companionLanguages.companion_profile_id, profile.id)),
    db.select().from(sessionCards)
      .where(and(eq(sessionCards.companion_profile_id, profile.id), isNull(sessionCards.deleted_at))),
    db.select({ url: companionPhotos.url, s3Key: companionPhotos.storage_key })
      .from(companionPhotos)
      .where(and(eq(companionPhotos.companion_profile_id, profile.id), isNull(companionPhotos.deleted_at))),
    db.select({ url: companionVideos.url, s3Key: companionVideos.storage_key, durationSeconds: companionVideos.duration_seconds })
      .from(companionVideos)
      .where(and(eq(companionVideos.companion_profile_id, profile.id), isNull(companionVideos.deleted_at))),
  ])

  const langIds   = langRows.map(l => l.language_id)
  const vibeIds   = vibeRows.map(v => v.vibe_tag_id)

  const [langRecords, vibeRecords] = await Promise.all([
    langIds.length  ? db.select({ id: languages.id, code: languages.code }).from(languages).where(inArray(languages.id, langIds)) : [],
    vibeIds.length  ? db.select({ id: vibeTags.id, name: vibeTags.name }).from(vibeTags).where(inArray(vibeTags.id, vibeIds)) : [],
  ])

  return NextResponse.json({
    draft: {
      fullName:        companion.full_name ?? '',
      dateOfBirth:     companion.date_of_birth ?? '',
      country:         companion.country ?? '',
      displayName:     companion.name ?? '',
      tagline:         profile.tagline ?? '',
      bio:             profile.bio ?? '',
      city:            profile.city ?? '',
      availability:    profile.availability_status,
      fantasyTagIds:   fantRows.map(f => f.fantasy_tag_id),
      vibeTagNames:    (vibeRecords as { name: string }[]).map(v => v.name),
      languageCodes:   (langRecords as { code: string }[]).map(l => l.code),
      defaultCurrency: profile.currency,
      sessionCards:    cardRows.map(c => ({
        title:       c.title,
        sessionType: c.session_type ?? 'in_person',
        durationKey: minutesToKey(c.duration_minutes),
        price:       c.price ? Number(c.price) : null,
        currency:    c.currency,
        description: c.description ?? '',
      })),
      photos: photoRows,
      video:  videoRows[0] ?? null,
    },
  })
}

// ─── POST /api/companions/onboarding/profile ──────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const companion = await db.query.companions.findFirst({ where: eq(companions.email, session.user.email) })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  // Update companions row
  await db.update(companions).set({
    full_name:     data.fullName,
    date_of_birth: data.dateOfBirth,
    country:       data.country,
    name:          data.displayName,
    updated_at:    new Date(),
  }).where(eq(companions.id, companion.id))

  // Upsert companion_profiles
  const [profileRow] = await db.insert(companionProfiles).values({
    companion_id:        companion.id,
    bio:                 data.bio ?? null,
    tagline:             data.tagline ?? null,
    city:                data.city,
    availability_status: data.availability,
    currency:            data.defaultCurrency,
  }).onConflictDoUpdate({
    target: companionProfiles.companion_id,
    set: {
      bio:                 data.bio ?? null,
      tagline:             data.tagline ?? null,
      city:                data.city,
      availability_status: data.availability,
      currency:            data.defaultCurrency,
      updated_at:          new Date(),
    },
  }).returning({ id: companionProfiles.id })

  const profileId = profileRow.id

  // ─── Fantasy tags ─────────────────────────────────────────────────────────
  await db.delete(companionFantasyTags).where(eq(companionFantasyTags.companion_profile_id, profileId))
  if (data.fantasyTagIds.length > 0) {
    // Validate IDs exist in fantasy_tags table
    const validTags = await db.select({ id: fantasyTags.id }).from(fantasyTags)
      .where(inArray(fantasyTags.id, data.fantasyTagIds))
    if (validTags.length > 0) {
      await db.insert(companionFantasyTags).values(
        validTags.map(t => ({ companion_profile_id: profileId, fantasy_tag_id: t.id }))
      ).onConflictDoNothing()
    }
  }

  // ─── Vibe tags ────────────────────────────────────────────────────────────
  await db.delete(companionVibeTags).where(eq(companionVibeTags.companion_profile_id, profileId))
  if (data.vibeTagNames.length > 0) {
    const vibeRecords = await db.select({ id: vibeTags.id }).from(vibeTags)
      .where(inArray(vibeTags.name, data.vibeTagNames))
    if (vibeRecords.length > 0) {
      await db.insert(companionVibeTags).values(
        vibeRecords.map(v => ({ companion_profile_id: profileId, vibe_tag_id: v.id }))
      ).onConflictDoNothing()
    }
  }

  // ─── Languages ────────────────────────────────────────────────────────────
  await db.delete(companionLanguages).where(eq(companionLanguages.companion_profile_id, profileId))
  if (data.languageCodes.length > 0) {
    const langRecords = await db.select({ id: languages.id }).from(languages)
      .where(inArray(languages.code, data.languageCodes))
    if (langRecords.length > 0) {
      await db.insert(companionLanguages).values(
        langRecords.map(l => ({ companion_profile_id: profileId, language_id: l.id }))
      ).onConflictDoNothing()
    }
  }

  // ─── Session cards (soft-delete + reinsert) ───────────────────────────────
  await db.update(sessionCards).set({ deleted_at: new Date() })
    .where(and(eq(sessionCards.companion_profile_id, profileId), isNull(sessionCards.deleted_at)))

  if (data.sessionCards.length > 0) {
    await db.insert(sessionCards).values(
      data.sessionCards.map((c, i) => ({
        companion_profile_id: profileId,
        title:                c.title,
        description:          c.description ?? null,
        duration_minutes:     DURATION_MAP[c.durationKey] ?? null,
        price:                c.price != null ? String(c.price) : null,
        currency:             c.currency,
        session_type:         c.sessionType,
        sort_order:           i,
      }))
    )
  }

  // ─── Photos ───────────────────────────────────────────────────────────────
  await db.update(companionPhotos).set({ deleted_at: new Date() })
    .where(and(eq(companionPhotos.companion_profile_id, profileId), isNull(companionPhotos.deleted_at)))

  if (data.photos.length > 0) {
    await db.insert(companionPhotos).values(
      data.photos.map((p, i) => ({
        companion_profile_id: profileId,
        url:                  p.url,
        storage_key:          p.s3Key,
        sort_order:           i,
        is_primary:           i === 0,
      }))
    )
  }

  // ─── Video ────────────────────────────────────────────────────────────────
  await db.update(companionVideos).set({ deleted_at: new Date() })
    .where(and(eq(companionVideos.companion_profile_id, profileId), isNull(companionVideos.deleted_at)))

  if (data.video) {
    await db.insert(companionVideos).values({
      companion_profile_id: profileId,
      url:                  data.video.url,
      storage_key:          data.video.s3Key,
      duration_seconds:     data.video.durationSeconds,
    })
  }

  // ─── Advance stage ────────────────────────────────────────────────────────
  await db.update(companions).set({ companion_stage: 2, updated_at: new Date() })
    .where(eq(companions.id, companion.id))

  await db.insert(companionOnboardingProgress).values({
    companion_id: companion.id,
    stage:        2,
    status:       'completed',
    completed_at: new Date(),
  }).onConflictDoUpdate({
    target:       [companionOnboardingProgress.companion_id, companionOnboardingProgress.stage],
    set:          { status: 'completed', completed_at: new Date() },
  })

  return NextResponse.json({ success: true })
}
