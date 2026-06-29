import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  companionStoryBridges,
  companionProfiles,
  companions,
  stories,
  notifications,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'

const schema = z.object({
  action: z.enum(['approve', 'reject']),
  admin_note: z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { action, admin_note } = parsed.data
  const now = new Date()

  // Fetch bridge + story title + companion_id for notification
  const bridgeRows = await db
    .select({
      id: companionStoryBridges.id,
      status: companionStoryBridges.status,
      companion_profile_id: companionStoryBridges.companion_profile_id,
      story_id: companionStoryBridges.story_id,
      story_title: stories.title,
      companion_id: companions.id,
    })
    .from(companionStoryBridges)
    .innerJoin(
      companionProfiles,
      eq(companionStoryBridges.companion_profile_id, companionProfiles.id)
    )
    .innerJoin(companions, eq(companionProfiles.companion_id, companions.id))
    .innerJoin(stories, eq(companionStoryBridges.story_id, stories.id))
    .where(eq(companionStoryBridges.id, params.id))
    .limit(1)

  if (!bridgeRows[0]) {
    return NextResponse.json({ error: 'Bridge not found' }, { status: 404 })
  }

  const bridge = bridgeRows[0]

  if (action === 'approve') {
    await db
      .update(companionStoryBridges)
      .set({ status: 'approved', approved_at: now })
      .where(eq(companionStoryBridges.id, params.id))

    // Notify companion
    await db.insert(notifications).values({
      recipient_type: 'companion',
      recipient_id: bridge.companion_id,
      notification_type: 'bridge_approved',
      title: 'Bridge link approved',
      body: `Your link to "${bridge.story_title}" is now live.`,
      action_url: '/companion/bridge',
    })
  } else {
    await db
      .update(companionStoryBridges)
      .set({ status: 'rejected', admin_note: admin_note ?? null })
      .where(eq(companionStoryBridges.id, params.id))
  }

  return NextResponse.json({ success: true })
}
