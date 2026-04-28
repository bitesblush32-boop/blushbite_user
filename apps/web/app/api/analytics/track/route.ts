import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  analyticsEvents, companions, companionProfiles, notifications,
} from '@/db/schema'
import { eq, and, desc, gte } from 'drizzle-orm'

const schema = z.object({
  event_type:           z.enum(['profile_view', 'story_view', 'whatsapp_click', 'bridge_click', 'search_impression']),
  companion_profile_id: z.string().uuid(),
  story_id:             z.string().uuid().optional(),
})

export async function POST(req: Request) {
  const body   = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { event_type, companion_profile_id, story_id } = parsed.data

  const session       = await auth()
  const viewerUserId  = session?.user?.id ?? null
  const isCompanion   = session?.user?.platform_role === 'companion'

  // Don't record self-views
  if (isCompanion && viewerUserId) {
    const profile = await db
      .select({ companion_id: companionProfiles.companion_id })
      .from(companionProfiles)
      .where(eq(companionProfiles.id, companion_profile_id))
      .limit(1)
    if (profile[0]?.companion_id === viewerUserId) {
      return NextResponse.json({ ok: true, skipped: true })
    }
  }

  // Privacy-safe IP hash (first 16 hex chars of SHA-256)
  const ip      = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const salt    = process.env.IP_SALT ?? 'bb_default_salt'
  const ipHash  = createHash('sha256').update(ip + salt).digest('hex').slice(0, 16)

  await db.insert(analyticsEvents).values({
    event_type,
    companion_profile_id,
    viewer_user_id:  viewerUserId,
    story_id:        story_id ?? null,
    viewer_ip_hash:  ipHash,
  })

  // Create profile_view notification — throttled to 1 per 4 hours
  if (event_type === 'profile_view') {
    const profileRow = await db
      .select({ companion_id: companionProfiles.companion_id })
      .from(companionProfiles)
      .where(eq(companionProfiles.id, companion_profile_id))
      .limit(1)

    if (profileRow.length) {
      const companionId = profileRow[0].companion_id
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)

      const recent = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(and(
          eq(notifications.recipient_type,    'companion'),
          eq(notifications.recipient_id,      companionId),
          eq(notifications.notification_type, 'profile_viewed'),
          gte(notifications.created_at,        fourHoursAgo),
        ))
        .limit(1)

      if (!recent.length) {
        await db.insert(notifications).values({
          recipient_type:    'companion',
          recipient_id:      companionId,
          notification_type: 'profile_viewed',
          title:             'New profile view',
          body:              'Someone viewed your profile',
          action_url:        '/companion/analytics',
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
