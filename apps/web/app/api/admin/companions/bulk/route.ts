import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  companions,
  companionProfiles,
  companionVerifications,
  companionLegalDocs,
  companionOnboardingProgress,
  companionPaymentSetup,
  bookingRequests,
  fantasyTagOverlapScores,
  notifications,
  stories,
  audioRecordings,
  deviceCommunityBindings,
} from '@/db/schema'
import { inArray, and, eq } from 'drizzle-orm'

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const { ids } = body as { ids?: string[] }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 })
  }
  if (ids.length > 100) {
    return NextResponse.json({ error: 'Cannot delete more than 100 at once' }, { status: 400 })
  }

  // Fetch profile IDs for all companions first
  const profileRows = await db
    .select({ id: companionProfiles.id })
    .from(companionProfiles)
    .where(inArray(companionProfiles.companion_id, ids))

  const profileIds = profileRows.map((r) => r.id)

  // Delete non-cascade tables in dependency order
  if (profileIds.length > 0) {
    await db
      .delete(bookingRequests)
      .where(inArray(bookingRequests.companion_profile_id, profileIds))
    await db
      .delete(fantasyTagOverlapScores)
      .where(inArray(fantasyTagOverlapScores.companion_profile_id, profileIds))
  }

  await db
    .delete(notifications)
    .where(
      and(eq(notifications.recipient_type, 'companion'), inArray(notifications.recipient_id, ids))
    )
  await db.delete(companionVerifications).where(inArray(companionVerifications.companion_id, ids))
  await db.delete(companionLegalDocs).where(inArray(companionLegalDocs.companion_id, ids))
  await db
    .delete(companionOnboardingProgress)
    .where(inArray(companionOnboardingProgress.companion_id, ids))
  await db.delete(companionPaymentSetup).where(inArray(companionPaymentSetup.companion_id, ids))

  // Disassociate authored content (preserve content, remove author link)
  await db
    .update(stories)
    .set({ author_companion_id: null, author_type: 'admin' })
    .where(inArray(stories.author_companion_id, ids))

  await db
    .update(audioRecordings)
    .set({ author_companion_id: null, companion_profile_id: null, author_type: 'user' })
    .where(inArray(audioRecordings.author_companion_id, ids))

  // Remove device fingerprint bindings
  await db.delete(deviceCommunityBindings).where(inArray(deviceCommunityBindings.companion_id, ids))

  // Delete companions — CASCADE removes profiles, photos, videos, tags, session_cards, etc.
  const deleted = await db
    .delete(companions)
    .where(inArray(companions.id, ids))
    .returning({ id: companions.id })

  return NextResponse.json({ ok: true, deleted: deleted.length })
}
