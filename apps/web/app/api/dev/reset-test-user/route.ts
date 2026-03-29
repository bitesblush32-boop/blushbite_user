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

  // ── Look up both rows up front ────────────────────────────────────────────────
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

  // ── Delete user-side rows (explicit order before deleting users row) ──────────
  if (userId) {
    await db.delete(userProfiles).where(eq(userProfiles.user_id, userId))
    await db.delete(userFantasyTags).where(eq(userFantasyTags.user_id, userId))
    await db.delete(userAccounts).where(eq(userAccounts.user_id, userId))
  }

  // ── Delete companion-side rows (explicit order before deleting companions row)─
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

  // ── Delete users row last ────────────────────────────────────────────────────
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
