import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  users,
  userProfiles,
  userFantasyTags,
  userAccounts,
  companions,
  companionOnboardingProgress,
  companionVerifications,
  companionLegalDocs,
  companionPaymentSetup,
  companionProfiles,
  stories,
  audioRecordings,
  bookingRequests,
  fantasyTagOverlapScores,
} from '@/db/schema'

const FALLBACK_EMAIL = 'test@blushbite.dev'

export async function POST(req: NextRequest) {
  // ── Production guard ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production.' },
      { status: 403 },
    )
  }

  // ── Resolve target email ─────────────────────────────────────────────────────
  let email: string = process.env.DEV_TEST_EMAIL ?? FALLBACK_EMAIL

  try {
    const body = await req.json().catch(() => ({}))
    if (typeof body?.email === 'string' && body.email.trim()) {
      email = body.email.trim()
    }
  } catch {
    // malformed body — use default
  }

  // ── Look up root rows ────────────────────────────────────────────────────────
  const [userRow] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  const [companionRow] = await db
    .select({ id: companions.id })
    .from(companions)
    .where(eq(companions.email, email))
    .limit(1)

  const userId      = userRow?.id      ?? null
  const companionId = companionRow?.id ?? null

  // companion_profile_id is required to clear booking_requests and
  // fantasy_tag_overlap_scores which FK to companion_profiles.id without cascade
  let companionProfileId: string | null = null
  if (companionId) {
    const [cpRow] = await db
      .select({ id: companionProfiles.id })
      .from(companionProfiles)
      .where(eq(companionProfiles.companion_id, companionId))
      .limit(1)
    companionProfileId = cpRow?.id ?? null
  }

  // ── Step 1 — fantasy_tag_overlap_scores (FKs: users.id, companion_profiles.id — no cascade) ─
  if (userId) {
    await db
      .delete(fantasyTagOverlapScores)
      .where(eq(fantasyTagOverlapScores.user_id, userId))
  }
  if (companionProfileId) {
    await db
      .delete(fantasyTagOverlapScores)
      .where(eq(fantasyTagOverlapScores.companion_profile_id, companionProfileId))
  }

  // ── Step 2 — booking_requests (FKs: users.id, companion_profiles.id — no cascade) ──────────
  if (userId) {
    await db
      .delete(bookingRequests)
      .where(eq(bookingRequests.user_id, userId))
  }
  if (companionProfileId) {
    await db
      .delete(bookingRequests)
      .where(eq(bookingRequests.companion_profile_id, companionProfileId))
  }

  // ── Step 3 — audio_recordings BEFORE stories ────────────────────────────────
  // audio_recordings.story_id → stories.id (no cascade), so audio must go first.
  // Also FKs to users.id, companions.id, companion_profiles.id — all no cascade.
  if (userId) {
    await db
      .delete(audioRecordings)
      .where(eq(audioRecordings.author_user_id, userId))
  }
  if (companionId) {
    await db
      .delete(audioRecordings)
      .where(eq(audioRecordings.author_companion_id, companionId))
  }
  if (companionProfileId) {
    await db
      .delete(audioRecordings)
      .where(eq(audioRecordings.companion_profile_id, companionProfileId))
  }

  // ── Step 4 — stories (FKs: users.id, companions.id — no cascade) ────────────
  // story_mood_tags, story_orientation_tags, story_fantasy_tags cascade from story_id.
  if (userId) {
    await db
      .delete(stories)
      .where(eq(stories.author_user_id, userId))
  }
  if (companionId) {
    await db
      .delete(stories)
      .where(eq(stories.author_companion_id, companionId))
  }

  // ── Step 5 — user-side rows (explicit order before deleting users row) ───────
  if (userId) {
    await db.delete(userProfiles).where(eq(userProfiles.user_id, userId))
    await db.delete(userFantasyTags).where(eq(userFantasyTags.user_id, userId))
    await db.delete(userAccounts).where(eq(userAccounts.user_id, userId))
  }

  // ── Step 6 — companion-side rows (explicit order before deleting companions row)
  if (companionId) {
    await db
      .delete(companionOnboardingProgress)
      .where(eq(companionOnboardingProgress.companion_id, companionId))

    await db
      .delete(companionVerifications)
      .where(eq(companionVerifications.companion_id, companionId))

    await db
      .delete(companionLegalDocs)
      .where(eq(companionLegalDocs.companion_id, companionId))

    await db
      .delete(companionPaymentSetup)
      .where(eq(companionPaymentSetup.companion_id, companionId))

    // CASCADE on companion_profiles handles: companion_photos, companion_videos,
    // companion_languages, companion_vibe_tags, companion_fantasy_tags, session_cards
    await db
      .delete(companionProfiles)
      .where(eq(companionProfiles.companion_id, companionId))

    await db.delete(companions).where(eq(companions.email, email))
  }

  // ── Step 7 — users row last ──────────────────────────────────────────────────
  // likes, saves, comments cascade from users.id — handled automatically.
  if (userId) {
    await db.delete(users).where(eq(users.email, email))
  }

  return NextResponse.json({
    success:  true,
    email,
    deleted: {
      user:      userId      !== null,
      companion: companionId !== null,
    },
  })
}
