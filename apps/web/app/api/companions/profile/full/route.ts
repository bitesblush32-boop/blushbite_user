import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  companions, companionProfiles, companionPhotos, companionVideos,
  companionVibeTags, companionFantasyTags, fantasyTags, vibeTags,
  sessionCards, stories, companionVerifications,
  companionLanguages, languages,
} from '@/db/schema'
import { eq, and, isNull, desc, asc, count } from 'drizzle-orm'
import { z } from 'zod'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureProfile(companionId: string) {
  let profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companionId),
  })
  if (!profile) {
    const [inserted] = await db
      .insert(companionProfiles)
      .values({ companion_id: companionId })
      .returning()
    profile = inserted
  }
  return profile
}

async function recomputeCompleteness(companionId: string, profileId: string) {
  const [comp, prof, [photosRow], [postsRow], verification] = await Promise.all([
    db.query.companions.findFirst({ where: eq(companions.id, companionId) }),
    db.query.companionProfiles.findFirst({ where: eq(companionProfiles.companion_id, companionId) }),
    db.select({ c: count() }).from(companionPhotos)
      .where(and(eq(companionPhotos.companion_profile_id, profileId), isNull(companionPhotos.deleted_at))),
    db.select({ c: count() }).from(stories)
      .where(eq(stories.author_companion_id, companionId)),
    db.query.companionVerifications.findFirst({ where: eq(companionVerifications.companion_id, companionId) }),
  ])

  const photoCount = Number(photosRow?.c ?? 0)
  const postCount  = Number(postsRow?.c  ?? 0)

  const checks = [
    photoCount > 0,
    postCount  > 0,
    !!comp?.name?.trim(),
    !!comp?.date_of_birth,
    !!comp?.country,
    !!(prof?.whatsapp_number ?? comp?.whatsapp_number),
    verification?.provider_status === 'approved',
    prof?.is_live === true,
  ]

  const score          = Math.round(checks.filter(Boolean).length / checks.length * 100)
  const visibleToUsers = checks.every(Boolean)

  await db.update(companionProfiles)
    .set({ profile_completeness: score, is_visible_to_users: visibleToUsers, updated_at: new Date() })
    .where(eq(companionProfiles.companion_id, companionId))

  return { score, visibleToUsers }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const profile = await ensureProfile(companion.id)

  const [
    photos, videos, companionStories, verification,
    fantasyTagRows, vibeTagRows, sessionCardRows,
    availableVibeTagRows, availableFantasyTagRows,
    languageRows, availableLanguageRows,
  ] = await Promise.all([
    db.select().from(companionPhotos)
      .where(and(eq(companionPhotos.companion_profile_id, profile.id), isNull(companionPhotos.deleted_at)))
      .orderBy(asc(companionPhotos.sort_order)),
    db.select().from(companionVideos)
      .where(and(eq(companionVideos.companion_profile_id, profile.id), isNull(companionVideos.deleted_at))),
    db.select({
      id: stories.id, title: stories.title, body: stories.body,
      moderation_status: stories.moderation_status,
      like_count: stories.like_count, created_at: stories.created_at,
    }).from(stories)
      .where(eq(stories.author_companion_id, companion.id))
      .orderBy(desc(stories.created_at))
      .limit(10),
    db.query.companionVerifications.findFirst({
      where: eq(companionVerifications.companion_id, companion.id),
    }),
    db.select({ fantasy_tag_id: companionFantasyTags.fantasy_tag_id })
      .from(companionFantasyTags)
      .where(eq(companionFantasyTags.companion_profile_id, profile.id)),
    db.select({ vibe_tag_id: companionVibeTags.vibe_tag_id })
      .from(companionVibeTags)
      .where(eq(companionVibeTags.companion_profile_id, profile.id)),
    db.select().from(sessionCards)
      .where(and(eq(sessionCards.companion_profile_id, profile.id), isNull(sessionCards.deleted_at)))
      .orderBy(asc(sessionCards.sort_order)),
    db.select({ id: vibeTags.id, name: vibeTags.name })
      .from(vibeTags)
      .where(eq(vibeTags.is_active, true)),
    db.select({ id: fantasyTags.id, name: fantasyTags.name, category_id: fantasyTags.category_id })
      .from(fantasyTags)
      .where(eq(fantasyTags.is_active, true))
      .orderBy(asc(fantasyTags.id)),
    db.select({ language_id: companionLanguages.language_id, fluency: companionLanguages.fluency })
      .from(companionLanguages)
      .where(eq(companionLanguages.companion_profile_id, profile.id)),
    db.select({ id: languages.id, code: languages.code, name: languages.name })
      .from(languages)
      .orderBy(asc(languages.name)),
  ])

  return NextResponse.json({
    companion: {
      id:               companion.id,
      name:             companion.name,
      email:            companion.email,
      alias:            companion.alias,
      full_name:        companion.full_name,
      date_of_birth:    companion.date_of_birth,
      country:          companion.country,
      whatsapp_number:  companion.whatsapp_number,
      companion_stage:  companion.companion_stage,
    },
    profile: {
      id:                   profile.id,
      bio:                  profile.bio,
      tagline:              profile.tagline,
      city:                 profile.city,
      availability_status:  profile.availability_status,
      hourly_rate:          profile.hourly_rate,
      currency:             profile.currency,
      is_live:              profile.is_live,
      is_verified:          profile.is_verified,
      height_cm:            profile.height_cm,
      body_type:            profile.body_type,
      ethnicity:            profile.ethnicity,
      eye_color:            profile.eye_color,
      hair_color:           profile.hair_color,
      gender:               profile.gender,
      skin_color:           profile.skin_color,
      session_modality:     profile.session_modality,
      instagram_handle:     profile.instagram_handle,
      website_url:          profile.website_url,
      whatsapp_number:      profile.whatsapp_number,
      profile_completeness: profile.profile_completeness,
      is_visible_to_users:  profile.is_visible_to_users,
    },
    photos,
    videos,
    stories: companionStories,
    verification: verification ? {
      provider_status:       verification.provider_status,
      liveness_check_passed: verification.liveness_check_passed,
      verified_at:           verification.verified_at?.toISOString() ?? null,
    } : null,
    selected_fantasy_tag_ids: fantasyTagRows.map(r => r.fantasy_tag_id),
    selected_vibe_tag_ids:    vibeTagRows.map(r => r.vibe_tag_id),
    selected_languages:       languageRows,
    available_fantasy_tags:   availableFantasyTagRows,
    available_vibe_tags:      availableVibeTagRows,
    available_languages:      availableLanguageRows,
    session_cards:            sessionCardRows,
  })
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

const basicsSchema = z.object({
  section:             z.literal('basics'),
  name:                z.string().min(1).max(255).optional(),
  bio:                 z.string().max(2000).optional(),
  tagline:             z.string().max(300).optional(),
  city:                z.string().max(100).optional(),
  availability_status: z.enum(['available', 'busy', 'offline']).optional(),
})
const physicalSchema = z.object({
  section:    z.literal('physical'),
  height_cm:  z.number().int().min(140).max(220).nullable().optional(),
  body_type:  z.enum(['slim','athletic','average','curvy','plus_size','prefer_not_to_say']).nullable().optional(),
  ethnicity:  z.string().max(50).nullable().optional(),
  eye_color:  z.string().max(30).nullable().optional(),
  hair_color: z.string().max(30).nullable().optional(),
  gender:     z.enum(['woman','man','non_binary','trans_woman','trans_man','other','prefer_not_to_say']).nullable().optional(),
  skin_color: z.enum(['fair','light','medium','olive','brown','dark','ebony','prefer_not_to_say']).nullable().optional(),
})
const whatsappSchema = z.object({
  section:          z.literal('whatsapp'),
  whatsapp_number:  z.string().regex(/^\+[1-9]\d{6,14}$/, 'Include country code e.g. +31612345678').nullable(),
})
const legalSchema = z.object({
  section:       z.literal('legal'),
  full_name:     z.string().min(2).max(255).optional(),
  date_of_birth: z.string().optional(),
  country:       z.string().max(100).optional(),
})
const tagsSchema = z.object({
  section:          z.literal('tags'),
  fantasy_tag_ids:  z.array(z.number().int()).optional(),
  vibe_tag_ids:     z.array(z.number().int()).optional(),
  languages:        z.array(z.object({
    language_id: z.number().int(),
    fluency:     z.enum(['native', 'fluent', 'conversational']),
  })).optional(),
})
const modalitySchema = z.object({
  section:          z.literal('modality'),
  session_modality: z.enum(['in_person', 'online', 'both']),
})
const socialSchema = z.object({
  section:          z.literal('social'),
  instagram_handle: z.string().max(100).nullable().optional(),
  website_url:      z.string().url().max(500).nullable().optional(),
})
const liveSchema = z.object({
  section:  z.literal('live'),
  is_live:  z.boolean(),
})
const servicesSchema = z.object({
  section:       z.literal('services'),
  session_cards: z.array(z.object({
    title:            z.string().min(1).max(200),
    description:      z.string().optional(),
    duration_minutes: z.number().int().optional(),
    price:            z.string().optional(),
    currency:         z.string().length(3).optional(),
    session_type:     z.enum(['in_person','audio_call','video_call','chat','custom']).optional(),
  })),
})
const availabilitySchema = z.object({
  section:             z.literal('availability'),
  availability_status: z.enum(['available', 'busy', 'offline']),
})
const setPrimaryPhotoSchema = z.object({
  section:  z.literal('set_primary_photo'),
  photo_id: z.string().uuid(),
})
const deletePhotoSchema = z.object({
  section:  z.literal('delete_photo'),
  photo_id: z.string().uuid(),
})
const addPhotoSchema = z.object({
  section:      z.literal('add_photo'),
  url:          z.string().url(),
  storage_key:  z.string(),
  is_primary:   z.boolean().optional(),
})
const addVideoSchema = z.object({
  section:          z.literal('add_video'),
  url:              z.string().url(),
  storage_key:      z.string(),
  duration_seconds: z.number().int().max(15).optional(),
})
const deleteVideoSchema = z.object({
  section:  z.literal('delete_video'),
  video_id: z.string().uuid(),
})

const patchSchema = z.discriminatedUnion('section', [
  basicsSchema, physicalSchema, whatsappSchema, legalSchema,
  tagsSchema, servicesSchema, availabilitySchema,
  modalitySchema, socialSchema, liveSchema,
  setPrimaryPhotoSchema, deletePhotoSchema, addPhotoSchema,
  addVideoSchema, deleteVideoSchema,
])

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const profile = await ensureProfile(companion.id)

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const now  = new Date()

  switch (data.section) {
    case 'basics': {
      if (data.name !== undefined) {
        await db.update(companions)
          .set({ name: data.name, updated_at: now })
          .where(eq(companions.id, companion.id))
      }
      const profileSet: Record<string, unknown> = { updated_at: now }
      if (data.bio                 !== undefined) profileSet.bio                 = data.bio
      if (data.tagline             !== undefined) profileSet.tagline             = data.tagline
      if (data.city                !== undefined) profileSet.city                = data.city
      if (data.availability_status !== undefined) profileSet.availability_status = data.availability_status
      await db.update(companionProfiles).set(profileSet).where(eq(companionProfiles.companion_id, companion.id))
      break
    }
    case 'physical': {
      const set: Record<string, unknown> = { updated_at: now }
      if (data.height_cm  !== undefined) set.height_cm  = data.height_cm
      if (data.body_type  !== undefined) set.body_type  = data.body_type
      if (data.ethnicity  !== undefined) set.ethnicity  = data.ethnicity
      if (data.eye_color  !== undefined) set.eye_color  = data.eye_color
      if (data.hair_color !== undefined) set.hair_color = data.hair_color
      if (data.gender     !== undefined) set.gender     = data.gender
      if (data.skin_color !== undefined) set.skin_color = data.skin_color
      await db.update(companionProfiles).set(set).where(eq(companionProfiles.companion_id, companion.id))
      break
    }
    case 'whatsapp': {
      const num = data.whatsapp_number
      await db.update(companions)
        .set({ whatsapp_number: num, updated_at: now })
        .where(eq(companions.id, companion.id))
      await db.update(companionProfiles)
        .set({ whatsapp_number: num, updated_at: now })
        .where(eq(companionProfiles.companion_id, companion.id))
      break
    }
    case 'legal': {
      if (companion.companion_stage > 1) {
        return NextResponse.json({ error: 'Legal information is locked.' }, { status: 403 })
      }
      const set: Record<string, unknown> = { updated_at: now }
      if (data.full_name     !== undefined) set.full_name     = data.full_name
      if (data.date_of_birth !== undefined) set.date_of_birth = data.date_of_birth
      if (data.country       !== undefined) set.country       = data.country
      await db.update(companions).set(set).where(eq(companions.id, companion.id))
      break
    }
    case 'tags': {
      if (data.fantasy_tag_ids !== undefined) {
        await db.delete(companionFantasyTags)
          .where(eq(companionFantasyTags.companion_profile_id, profile.id))
        if (data.fantasy_tag_ids.length > 0) {
          await db.insert(companionFantasyTags)
            .values(data.fantasy_tag_ids.map(id => ({ companion_profile_id: profile.id, fantasy_tag_id: id })))
            .onConflictDoNothing()
        }
      }
      if (data.vibe_tag_ids !== undefined) {
        await db.delete(companionVibeTags)
          .where(eq(companionVibeTags.companion_profile_id, profile.id))
        if (data.vibe_tag_ids.length > 0) {
          await db.insert(companionVibeTags)
            .values(data.vibe_tag_ids.map(id => ({ companion_profile_id: profile.id, vibe_tag_id: id })))
            .onConflictDoNothing()
        }
      }
      if (data.languages !== undefined) {
        await db.delete(companionLanguages)
          .where(eq(companionLanguages.companion_profile_id, profile.id))
        if (data.languages.length > 0) {
          await db.insert(companionLanguages)
            .values(data.languages.map(l => ({
              companion_profile_id: profile.id,
              language_id: l.language_id,
              fluency: l.fluency,
            })))
            .onConflictDoNothing()
        }
      }
      break
    }
    case 'modality': {
      await db.update(companionProfiles)
        .set({ session_modality: data.session_modality, updated_at: now })
        .where(eq(companionProfiles.companion_id, companion.id))
      break
    }
    case 'social': {
      const set: Record<string, unknown> = { updated_at: now }
      if (data.instagram_handle !== undefined) set.instagram_handle = data.instagram_handle
      if (data.website_url      !== undefined) set.website_url      = data.website_url
      await db.update(companionProfiles).set(set).where(eq(companionProfiles.companion_id, companion.id))
      break
    }
    case 'live': {
      if (profile.profile_completeness < 70) {
        return NextResponse.json({ error: 'Complete 70% of your profile first.' }, { status: 403 })
      }
      await db.update(companionProfiles)
        .set({ is_live: data.is_live, updated_at: now })
        .where(eq(companionProfiles.companion_id, companion.id))
      break
    }
    case 'services': {
      await db.update(sessionCards)
        .set({ deleted_at: now })
        .where(and(eq(sessionCards.companion_profile_id, profile.id), isNull(sessionCards.deleted_at)))
      if (data.session_cards.length > 0) {
        await db.insert(sessionCards).values(
          data.session_cards.map((card, i) => ({
            companion_profile_id: profile.id,
            title:            card.title,
            description:      card.description      ?? null,
            duration_minutes: card.duration_minutes ?? null,
            price:            card.price            ?? null,
            currency:         card.currency         ?? 'EUR',
            session_type:     card.session_type     ?? null,
            sort_order:       i,
          }))
        )
      }
      break
    }
    case 'availability': {
      await db.update(companionProfiles)
        .set({ availability_status: data.availability_status, updated_at: now })
        .where(eq(companionProfiles.companion_id, companion.id))
      break
    }
    case 'set_primary_photo': {
      await db.update(companionPhotos)
        .set({ is_primary: false })
        .where(eq(companionPhotos.companion_profile_id, profile.id))
      await db.update(companionPhotos)
        .set({ is_primary: true })
        .where(eq(companionPhotos.id, data.photo_id))
      break
    }
    case 'delete_photo': {
      await db.update(companionPhotos)
        .set({ deleted_at: now })
        .where(eq(companionPhotos.id, data.photo_id))
      break
    }
    case 'add_photo': {
      await db.insert(companionPhotos).values({
        companion_profile_id: profile.id,
        url:         data.url,
        storage_key: data.storage_key,
        is_primary:  data.is_primary ?? false,
        sort_order:  0,
      })
      break
    }
    case 'add_video': {
      await db.insert(companionVideos).values({
        companion_profile_id: profile.id,
        url:              data.url,
        storage_key:      data.storage_key,
        duration_seconds: data.duration_seconds ?? null,
      })
      break
    }
    case 'delete_video': {
      await db.update(companionVideos)
        .set({ deleted_at: now })
        .where(eq(companionVideos.id, data.video_id))
      break
    }
  }

  const completeness = await recomputeCompleteness(companion.id, profile.id)
  return NextResponse.json({ success: true, ...completeness })
}
