import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  companions, companionProfiles,
  companionFantasyTags, vibeTags, companionVibeTags,
  companionLanguages, languages,
  sessionCards, companionPhotos, companionVideos,
  companionVerifications,
} from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

/** Upsert a bare companion_profiles row if one doesn't exist yet. */
async function getOrCreateProfile(companionId: string) {
  let profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companionId),
  })
  if (!profile) {
    const [created] = await db
      .insert(companionProfiles)
      .values({ companion_id: companionId })
      .onConflictDoNothing()
      .returning()
    profile = created ?? await db.query.companionProfiles.findFirst({
      where: eq(companionProfiles.companion_id, companionId),
    })
  }
  return profile!
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companion.id),
  })

  const companionData = {
    name:          companion.name ?? '',
    email:         companion.email,
    alias:         companion.alias ?? '',
    full_name:     companion.full_name ?? '',
    date_of_birth: companion.date_of_birth ?? null,
    country:       companion.country ?? '',
    has_password:  !!companion.hashed_password,
  }

  if (!profile) {
    return NextResponse.json({
      companion:       companionData,
      profile:         null,
      fantasy_tag_ids: [],
      vibe_tag_names:  [],
      language_codes:  [],
      session_cards:   [],
      photos:          [],
      videos:          [],
      verification:    null,
    })
  }

  const [fantasyRows, vibeRows, langRows, cardRows, photoRows, videoRows, verRow] = await Promise.all([
    db.select({ id: companionFantasyTags.fantasy_tag_id })
      .from(companionFantasyTags)
      .where(eq(companionFantasyTags.companion_profile_id, profile.id)),

    db.select({ name: vibeTags.name })
      .from(companionVibeTags)
      .innerJoin(vibeTags, eq(companionVibeTags.vibe_tag_id, vibeTags.id))
      .where(eq(companionVibeTags.companion_profile_id, profile.id)),

    db.select({ code: languages.code })
      .from(companionLanguages)
      .innerJoin(languages, eq(companionLanguages.language_id, languages.id))
      .where(eq(companionLanguages.companion_profile_id, profile.id)),

    db.select({
      id:               sessionCards.id,
      title:            sessionCards.title,
      description:      sessionCards.description,
      duration_minutes: sessionCards.duration_minutes,
      price:            sessionCards.price,
      currency:         sessionCards.currency,
      session_type:     sessionCards.session_type,
    })
      .from(sessionCards)
      .where(and(
        eq(sessionCards.companion_profile_id, profile.id),
        eq(sessionCards.is_active, true),
        isNull(sessionCards.deleted_at),
      ))
      .orderBy(sessionCards.sort_order),

    db.select({ id: companionPhotos.id, url: companionPhotos.url, storage_key: companionPhotos.storage_key })
      .from(companionPhotos)
      .where(and(eq(companionPhotos.companion_profile_id, profile.id), isNull(companionPhotos.deleted_at)))
      .orderBy(companionPhotos.sort_order),

    db.select({ id: companionVideos.id, url: companionVideos.url, storage_key: companionVideos.storage_key, duration_seconds: companionVideos.duration_seconds })
      .from(companionVideos)
      .where(and(eq(companionVideos.companion_profile_id, profile.id), isNull(companionVideos.deleted_at))),

    db.query.companionVerifications.findFirst({
      where: eq(companionVerifications.companion_id, companion.id),
    }),
  ])

  return NextResponse.json({
    companion: companionData,
    profile: {
      bio:                 profile.bio ?? '',
      tagline:             profile.tagline ?? '',
      city:                profile.city ?? '',
      hourly_rate:         profile.hourly_rate,
      currency:            profile.currency,
      availability_status: profile.availability_status,
      is_live:             profile.is_live,
      is_verified:         profile.is_verified,
      profile_completeness: profile.profile_completeness ?? 0,
      // Section G — appearance
      gender:              profile.gender ?? '',
      height_cm:           profile.height_cm ?? null,
      body_type:           profile.body_type ?? '',
      ethnicity:           profile.ethnicity ?? '',
      eye_color:           profile.eye_color ?? '',
      hair_color:          profile.hair_color ?? '',
      skin_color:          profile.skin_color ?? '',
      // Section H — connect
      whatsapp_number:     profile.whatsapp_number ?? '',
      instagram_handle:    profile.instagram_handle ?? '',
      website_url:         profile.website_url ?? '',
      // Section I — go live
      session_modality:    profile.session_modality ?? 'in_person',
    },
    fantasy_tag_ids: fantasyRows.map(r => r.id),
    vibe_tag_names:  vibeRows.map(r => r.name),
    language_codes:  langRows.map(r => r.code),
    session_cards:   cardRows.map(c => ({
      id:               c.id,
      title:            c.title,
      description:      c.description ?? '',
      duration_minutes: c.duration_minutes,
      price:            c.price?.toString() ?? '',
      currency:         c.currency,
      session_type:     c.session_type ?? 'in_person',
    })),
    photos:      photoRows,
    videos:      videoRows,
    verification: verRow ? {
      status:      verRow.provider_status ?? 'idle',
      verified_at: verRow.verified_at?.toISOString() ?? null,
    } : null,
  })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const body = await req.json()
  const { section } = body

  // ── Section A: display name only (legal_name, DOB, country are locked) ──────
  if (section === 'A') {
    const { displayName } = body
    if (!displayName?.trim()) return NextResponse.json({ error: 'Display name required' }, { status: 400 })
    await db.update(companions)
      .set({ name: displayName.trim() })
      .where(eq(companions.id, companion.id))
    return NextResponse.json({ success: true })
  }

  const profile = await getOrCreateProfile(companion.id)
  if (!profile) return NextResponse.json({ error: 'Profile not found — please complete onboarding first.' }, { status: 404 })

  // ── Section B: public profile ─────────────────────────────────────────────
  if (section === 'B') {
    const { tagline, bio, city, availability } = body
    await db.update(companionProfiles)
      .set({
        tagline:             tagline?.trim() || null,
        bio:                 bio?.trim() || null,
        city:                city?.trim() || null,
        availability_status: availability ?? 'available',
      })
      .where(eq(companionProfiles.id, profile.id))
    return NextResponse.json({ success: true })
  }

  // ── Section C: tags ───────────────────────────────────────────────────────
  if (section === 'C') {
    const { fantasyTagIds, vibeTagNames, languageCodes } = body

    const [allVibes, allLangs] = await Promise.all([
      db.query.vibeTags.findMany(),
      db.query.languages.findMany(),
    ])

    const vibeTagIds = ((vibeTagNames ?? []) as string[])
      .map(n => allVibes.find(v => v.name === n)?.id)
      .filter((id): id is number => id !== undefined)

    const langIds = ((languageCodes ?? []) as string[])
      .map(c => allLangs.find(l => l.code === c)?.id)
      .filter((id): id is number => id !== undefined)

    const { companionFantasyTags: cft, companionVibeTags: cvt, companionLanguages: cl } = await import('@/db/schema')

    await Promise.all([
      db.delete(cft).where(eq(cft.companion_profile_id, profile.id)),
      db.delete(cvt).where(eq(cvt.companion_profile_id, profile.id)),
      db.delete(cl).where(eq(cl.companion_profile_id, profile.id)),
    ])

    await Promise.all([
      (fantasyTagIds as number[])?.length
        ? db.insert(cft).values(fantasyTagIds.map((id: number) => ({ companion_profile_id: profile.id, fantasy_tag_id: id })))
        : Promise.resolve(),
      vibeTagIds.length
        ? db.insert(cvt).values(vibeTagIds.map(id => ({ companion_profile_id: profile.id, vibe_tag_id: id })))
        : Promise.resolve(),
      langIds.length
        ? db.insert(cl).values(langIds.map(id => ({ companion_profile_id: profile.id, language_id: id })))
        : Promise.resolve(),
    ])
    return NextResponse.json({ success: true })
  }

  // ── Section D: session cards ──────────────────────────────────────────────
  if (section === 'D') {
    const { sessionCardsData } = body
    const DURATION_MAP: Record<string, number | null> = {
      '30min': 30, '1h': 60, '2h': 120, halfday: 240, fullday: 480, custom: null,
    }

    await db.update(sessionCards)
      .set({ deleted_at: new Date(), is_active: false })
      .where(and(eq(sessionCards.companion_profile_id, profile.id), isNull(sessionCards.deleted_at)))

    if ((sessionCardsData as any[])?.length) {
      await db.insert(sessionCards).values(
        (sessionCardsData as any[]).map((c, i) => ({
          companion_profile_id: profile.id,
          title:            c.title,
          description:      c.description || null,
          duration_minutes: DURATION_MAP[c.durationKey] ?? null,
          price:            c.price ? String(c.price) : null,
          currency:         c.currency ?? 'EUR',
          session_type:     c.sessionType ?? 'in_person',
          is_active:        true,
          sort_order:       i,
        }))
      )
    }
    return NextResponse.json({ success: true })
  }

  // ── Section E: photos + video ─────────────────────────────────────────────
  if (section === 'E') {
    const { photos: photoData, video: videoData } = body

    await db.delete(companionPhotos).where(eq(companionPhotos.companion_profile_id, profile.id))
    await db.delete(companionVideos).where(eq(companionVideos.companion_profile_id, profile.id))

    if ((photoData as any[])?.length) {
      await db.insert(companionPhotos).values(
        (photoData as any[]).map((p, i) => ({
          companion_profile_id: profile.id,
          url:         p.url,
          storage_key: p.storage_key,
          sort_order:  i,
          is_primary:  i === 0,
          is_approved: false,
        }))
      )
    }

    if (videoData?.url) {
      await db.insert(companionVideos).values({
        companion_profile_id: profile.id,
        url:              videoData.url,
        storage_key:      videoData.storage_key,
        duration_seconds: videoData.durationSeconds ?? null,
        is_approved:      false,
      })
    }
    return NextResponse.json({ success: true })
  }

  // ── Section G: physical appearance ───────────────────────────────────────
  if (section === 'G') {
    const { gender, height_cm, body_type, ethnicity, eye_color, hair_color, skin_color } = body
    const VALID_GENDERS   = ['woman','man','non_binary','trans_woman','trans_man','other','prefer_not_to_say']
    const VALID_BODY      = ['slim','athletic','average','curvy','plus_size','prefer_not_to_say']
    const VALID_SKIN      = ['fair','light','medium','olive','brown','dark']

    await db.update(companionProfiles)
      .set({
        gender:    gender && VALID_GENDERS.includes(gender) ? gender : undefined,
        height_cm: height_cm ? Math.min(Math.max(Number(height_cm), 140), 220) : undefined,
        body_type: body_type && VALID_BODY.includes(body_type) ? body_type : undefined,
        ethnicity: ethnicity?.trim() || undefined,
        eye_color: eye_color?.trim() || undefined,
        hair_color: hair_color?.trim() || undefined,
        skin_color: skin_color && VALID_SKIN.includes(skin_color) ? skin_color : undefined,
      })
      .where(eq(companionProfiles.id, profile.id))
    return NextResponse.json({ success: true })
  }

  // ── Section H: connect (WhatsApp + social) ────────────────────────────────
  if (section === 'H') {
    const { whatsapp_number, instagram_handle, website_url } = body
    await db.update(companionProfiles)
      .set({
        whatsapp_number:  whatsapp_number?.trim() || null,
        instagram_handle: instagram_handle?.replace(/^@/, '').trim() || null,
        website_url:      website_url?.trim() || null,
      })
      .where(eq(companionProfiles.id, profile.id))
    return NextResponse.json({ success: true })
  }

  // ── Section I: go live (modality + is_live) ───────────────────────────────
  if (section === 'I') {
    const { session_modality, is_live } = body
    const VALID_MODALITY = ['in_person', 'online', 'both']

    const updates: Record<string, unknown> = {}
    if (session_modality && VALID_MODALITY.includes(session_modality)) {
      updates.session_modality = session_modality
    }
    if (typeof is_live === 'boolean') {
      if (is_live) {
        // Gate: require ≥ 70% completeness to go live
        const currentProfile = await db.query.companionProfiles.findFirst({
          where: eq(companionProfiles.id, profile.id),
          columns: { profile_completeness: true },
        })
        if ((currentProfile?.profile_completeness ?? 0) < 70) {
          return NextResponse.json({ error: 'Complete at least 70% of your profile first.' }, { status: 400 })
        }
      }
      updates.is_live = is_live
    }

    if (Object.keys(updates).length) {
      await db.update(companionProfiles)
        .set(updates as any)
        .where(eq(companionProfiles.id, profile.id))
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
}
