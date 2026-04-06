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

  const profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companion.id),
  })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

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

  return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
}
