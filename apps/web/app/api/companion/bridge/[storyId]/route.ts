import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, companionStoryBridges } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// ── DELETE /api/companion/bridge/[storyId] ────────────────────────────────────
// Removes a pending bridge link. Approved links cannot be self-removed.

export async function DELETE(
  _req: Request,
  { params }: { params: { storyId: string } },
) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storyId } = params

  const companionRow = await db
    .select({ id: companions.id })
    .from(companions)
    .where(eq(companions.email, session.user.email))
    .limit(1)

  if (!companionRow.length) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const profileRow = await db
    .select({ id: companionProfiles.id })
    .from(companionProfiles)
    .where(eq(companionProfiles.companion_id, companionRow[0].id))
    .limit(1)

  if (!profileRow.length) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const profileId = profileRow[0].id

  // Find the bridge and confirm it's pending
  const bridge = await db
    .select({ id: companionStoryBridges.id, status: companionStoryBridges.status })
    .from(companionStoryBridges)
    .where(and(
      eq(companionStoryBridges.companion_profile_id, profileId),
      eq(companionStoryBridges.story_id, storyId),
    ))
    .limit(1)

  if (!bridge.length) return NextResponse.json({ error: 'Link not found' }, { status: 404 })

  if (bridge[0].status !== 'pending') {
    return NextResponse.json(
      { error: 'Only pending links can be removed. Contact admin to remove approved links.' },
      { status: 422 },
    )
  }

  await db
    .delete(companionStoryBridges)
    .where(eq(companionStoryBridges.id, bridge[0].id))

  return NextResponse.json({ success: true })
}
