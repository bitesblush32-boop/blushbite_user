import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  companions,
  companionProfiles,
  companionVerifications,
  companionLegalDocs,
  companionOnboardingProgress,
  companionPhotos,
  companionVideos,
  companionFantasyTags,
  fantasyTags,
  companionVibeTags,
  vibeTags,
  sessionCards,
  companionPaymentSetup,
  bookingRequests,
  fantasyTagOverlapScores,
  notifications,
  stories,
  audioRecordings,
  deviceCommunityBindings,
} from '@/db/schema'
import { eq, and, isNull, asc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { id } = params

  const [companionRows, profileRows] = await Promise.all([
    db
      .select({
        id: companions.id,
        email: companions.email,
        name: companions.name,
        full_name: companions.full_name,
        date_of_birth: companions.date_of_birth,
        country: companions.country,
        companion_stage: companions.companion_stage,
        onboarding_complete: companions.onboarding_complete,
        created_at: companions.created_at,
        updated_at: companions.updated_at,
      })
      .from(companions)
      .where(eq(companions.id, id))
      .limit(1),

    db
      .select({
        id: companionProfiles.id,
        companion_id: companionProfiles.companion_id,
        bio: companionProfiles.bio,
        tagline: companionProfiles.tagline,
        city: companionProfiles.city,
        hourly_rate: companionProfiles.hourly_rate,
        currency: companionProfiles.currency,
        availability_status: companionProfiles.availability_status,
        is_verified: companionProfiles.is_verified,
        verified_at: companionProfiles.verified_at,
        is_live: companionProfiles.is_live,
        approved_at: companionProfiles.approved_at,
        created_at: companionProfiles.created_at,
        updated_at: companionProfiles.updated_at,
      })
      .from(companionProfiles)
      .where(eq(companionProfiles.companion_id, id))
      .limit(1),
  ])

  const companion = companionRows[0]
  if (!companion) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const profile = profileRows[0] ?? null

  const [
    verification,
    legalDocs,
    onboardingProgress,
    photos,
    videos,
    fantasyTagRows,
    vibeTagRows,
    sessionCardRows,
  ] = await Promise.all([
    db
      .select({
        id: companionVerifications.id,
        provider: companionVerifications.provider,
        provider_status: companionVerifications.provider_status,
        provider_reference_id: companionVerifications.provider_reference_id,
        liveness_check_passed: companionVerifications.liveness_check_passed,
        verified_at: companionVerifications.verified_at,
        id_document_front_url: companionVerifications.id_document_front_url,
        id_document_back_url: companionVerifications.id_document_back_url,
        selfie_url: companionVerifications.selfie_url,
        expires_at: companionVerifications.expires_at,
      })
      .from(companionVerifications)
      .where(eq(companionVerifications.companion_id, id))
      .limit(1),

    db
      .select({
        id: companionLegalDocs.id,
        document_type: companionLegalDocs.document_type,
        signed_at: companionLegalDocs.signed_at,
        ip_address: companionLegalDocs.ip_address,
        document_version: companionLegalDocs.document_version,
        created_at: companionLegalDocs.created_at,
      })
      .from(companionLegalDocs)
      .where(eq(companionLegalDocs.companion_id, id)),

    db
      .select({
        id: companionOnboardingProgress.id,
        stage: companionOnboardingProgress.stage,
        status: companionOnboardingProgress.status,
        completed_at: companionOnboardingProgress.completed_at,
        notes: companionOnboardingProgress.notes,
      })
      .from(companionOnboardingProgress)
      .where(eq(companionOnboardingProgress.companion_id, id))
      .orderBy(asc(companionOnboardingProgress.stage)),

    profile
      ? db
          .select({
            id: companionPhotos.id,
            url: companionPhotos.url,
            alt_text: companionPhotos.alt_text,
            sort_order: companionPhotos.sort_order,
            is_primary: companionPhotos.is_primary,
            is_approved: companionPhotos.is_approved,
            created_at: companionPhotos.created_at,
          })
          .from(companionPhotos)
          .where(
            and(
              eq(companionPhotos.companion_profile_id, profile.id),
              isNull(companionPhotos.deleted_at)
            )
          )
          .orderBy(asc(companionPhotos.sort_order))
      : Promise.resolve([]),

    profile
      ? db
          .select({
            id: companionVideos.id,
            url: companionVideos.url,
            thumbnail_url: companionVideos.thumbnail_url,
            duration_seconds: companionVideos.duration_seconds,
            is_approved: companionVideos.is_approved,
            created_at: companionVideos.created_at,
          })
          .from(companionVideos)
          .where(
            and(
              eq(companionVideos.companion_profile_id, profile.id),
              isNull(companionVideos.deleted_at)
            )
          )
      : Promise.resolve([]),

    profile
      ? db
          .select({ id: fantasyTags.id, name: fantasyTags.name, slug: fantasyTags.slug })
          .from(companionFantasyTags)
          .innerJoin(fantasyTags, eq(fantasyTags.id, companionFantasyTags.fantasy_tag_id))
          .where(eq(companionFantasyTags.companion_profile_id, profile.id))
      : Promise.resolve([]),

    profile
      ? db
          .select({
            id: vibeTags.id,
            name: vibeTags.name,
            slug: vibeTags.slug,
            emoji: vibeTags.emoji,
          })
          .from(companionVibeTags)
          .innerJoin(vibeTags, eq(vibeTags.id, companionVibeTags.vibe_tag_id))
          .where(eq(companionVibeTags.companion_profile_id, profile.id))
      : Promise.resolve([]),

    profile
      ? db
          .select({
            id: sessionCards.id,
            title: sessionCards.title,
            description: sessionCards.description,
            duration_minutes: sessionCards.duration_minutes,
            price: sessionCards.price,
            currency: sessionCards.currency,
            session_type: sessionCards.session_type,
            is_active: sessionCards.is_active,
            sort_order: sessionCards.sort_order,
          })
          .from(sessionCards)
          .where(
            and(eq(sessionCards.companion_profile_id, profile.id), isNull(sessionCards.deleted_at))
          )
          .orderBy(asc(sessionCards.sort_order))
      : Promise.resolve([]),
  ])

  return NextResponse.json({
    companion,
    profile,
    verification: verification[0] ?? null,
    legal_docs: legalDocs,
    onboarding_progress: onboardingProgress,
    photos,
    videos,
    fantasy_tags: fantasyTagRows,
    vibe_tags: vibeTagRows,
    session_cards: sessionCardRows,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { id } = params
  const body = await req.json()

  if (typeof body.is_live === 'boolean') {
    await db
      .update(companionProfiles)
      .set({
        is_live: body.is_live,
        is_visible_to_users: body.is_live,
        ...(body.is_live ? { approved_at: new Date() } : {}),
      })
      .where(eq(companionProfiles.companion_id, id))
  }

  if (body.force_verify) {
    await db
      .update(companionProfiles)
      .set({ is_verified: true, verified_at: new Date() })
      .where(eq(companionProfiles.companion_id, id))
  }

  if (body.fantasy_tag_ids !== undefined || body.vibe_tag_ids !== undefined) {
    const [profileRow] = await db
      .select({ id: companionProfiles.id })
      .from(companionProfiles)
      .where(eq(companionProfiles.companion_id, id))
      .limit(1)

    if (profileRow) {
      if (body.fantasy_tag_ids !== undefined) {
        await db
          .delete(companionFantasyTags)
          .where(eq(companionFantasyTags.companion_profile_id, profileRow.id))
        if ((body.fantasy_tag_ids as number[]).length) {
          await db.insert(companionFantasyTags).values(
            (body.fantasy_tag_ids as number[]).map((tid: number) => ({
              companion_profile_id: profileRow.id,
              fantasy_tag_id: tid,
            }))
          )
        }
      }
      if (body.vibe_tag_ids !== undefined) {
        await db
          .delete(companionVibeTags)
          .where(eq(companionVibeTags.companion_profile_id, profileRow.id))
        if ((body.vibe_tag_ids as number[]).length) {
          await db.insert(companionVibeTags).values(
            (body.vibe_tag_ids as number[]).map((tid: number) => ({
              companion_profile_id: profileRow.id,
              vibe_tag_id: tid,
            }))
          )
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { id } = params

  // Verify companion exists and get profile_id
  const [companion] = await db
    .select({ id: companions.id })
    .from(companions)
    .where(eq(companions.id, id))
    .limit(1)
  if (!companion) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [profile] = await db
    .select({ id: companionProfiles.id })
    .from(companionProfiles)
    .where(eq(companionProfiles.companion_id, id))
    .limit(1)

  // Delete tables without cascade FKs first
  if (profile) {
    await db.delete(bookingRequests).where(eq(bookingRequests.companion_profile_id, profile.id))
    await db
      .delete(fantasyTagOverlapScores)
      .where(eq(fantasyTagOverlapScores.companion_profile_id, profile.id))
  }
  await db
    .delete(notifications)
    .where(and(eq(notifications.recipient_type, 'companion'), eq(notifications.recipient_id, id)))
  await db.delete(companionVerifications).where(eq(companionVerifications.companion_id, id))
  await db.delete(companionLegalDocs).where(eq(companionLegalDocs.companion_id, id))
  await db.delete(companionPaymentSetup).where(eq(companionPaymentSetup.companion_id, id))
  // Null out authored stories and audio (preserve content, disassociate author)
  await db
    .update(stories)
    .set({ author_companion_id: null, author_type: 'admin' })
    .where(eq(stories.author_companion_id, id))
  await db
    .update(audioRecordings)
    .set({ author_companion_id: null, companion_profile_id: null, author_type: 'user' })
    .where(eq(audioRecordings.author_companion_id, id))
  // Remove device fingerprint bindings so the deleted companion returns to the community picker
  // if they visit again — treated as a completely new user
  await db.delete(deviceCommunityBindings).where(eq(deviceCommunityBindings.companion_id, id))
  // Delete the companion — cascades: companion_accounts, companion_profiles (→ photos, videos,
  // languages, tags, session_cards, story_bridges, analytics_events), onboarding_progress,
  // didit_extracted_data
  await db.delete(companions).where(eq(companions.id, id))

  return NextResponse.json({ success: true })
}
