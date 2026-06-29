import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  users,
  userProfiles,
  stories,
  bookingRequests,
  fantasyTagOverlapScores,
  notifications,
  audioRecordings,
} from '@/db/schema'
import { eq, and, desc, sql, isNull, ne } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { id } = params

  const [[userRow], [profileRow], recentStories] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        alias: users.alias,
        name: users.name,
        image: users.image,
        onboarding_complete: users.onboarding_complete,
        is_flagged: users.is_flagged,
        deleted_at: users.deleted_at,
        created_at: users.created_at,
        story_count: sql<number>`(SELECT COUNT(*)::int FROM stories WHERE author_user_id = ${users.id})`,
        like_count: sql<number>`(SELECT COUNT(*)::int FROM likes WHERE user_id = ${users.id})`,
        save_count: sql<number>`(SELECT COUNT(*)::int FROM saves WHERE user_id = ${users.id})`,
        booking_count: sql<number>`(SELECT COUNT(*)::int FROM booking_requests WHERE user_id = ${users.id})`,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1),

    db
      .select({
        gender: userProfiles.gender,
        vibes: userProfiles.vibes,
        mood_intensity: userProfiles.mood_intensity,
        display_name: userProfiles.display_name,
      })
      .from(userProfiles)
      .where(eq(userProfiles.user_id, id))
      .limit(1),

    db
      .select({
        id: stories.id,
        title: stories.title,
        created_at: stories.created_at,
        moderation_status: stories.moderation_status,
      })
      .from(stories)
      .where(eq(stories.author_user_id, id))
      .orderBy(desc(stories.created_at))
      .limit(10),
  ])

  if (!userRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    user: userRow,
    profile: profileRow ?? null,
    recent_stories: recentStories,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { action } = await req.json()
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 })

  const { id } = params

  if (action === 'ban') {
    await db
      .update(users)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(eq(users.id, id))
    return NextResponse.json({ success: true })
  }

  if (action === 'unban') {
    await db.update(users).set({ deleted_at: null, updated_at: new Date() }).where(eq(users.id, id))
    return NextResponse.json({ success: true })
  }

  if (action === 'flag') {
    await db.update(users).set({ is_flagged: true, updated_at: new Date() }).where(eq(users.id, id))
    return NextResponse.json({ success: true })
  }

  if (action === 'unflag') {
    await db
      .update(users)
      .set({ is_flagged: false, updated_at: new Date() })
      .where(eq(users.id, id))
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(_req)
  if (!guard.ok) return guard.response

  const { id } = params

  // Verify user exists and is not an admin account
  const [target] = await db
    .select({ id: users.id, platform_role: userProfiles.platform_role })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.user_id, users.id))
    .where(eq(users.id, id))
    .limit(1)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.platform_role === 'admin') {
    return NextResponse.json({ error: 'Admin accounts cannot be deleted here' }, { status: 403 })
  }

  // Delete in dependency order — tables without cascade FK must go first
  await db.delete(bookingRequests).where(eq(bookingRequests.user_id, id))
  await db.delete(fantasyTagOverlapScores).where(eq(fantasyTagOverlapScores.user_id, id))
  await db
    .delete(notifications)
    .where(and(eq(notifications.recipient_type, 'user'), eq(notifications.recipient_id, id)))
  // Stories and audio authored by this user (junction tables cascade automatically)
  await db.delete(stories).where(eq(stories.author_user_id, id))
  await db.delete(audioRecordings).where(eq(audioRecordings.author_user_id, id))
  // Finally delete the user — cascades: user_accounts, user_profiles, user_fantasy_tags,
  // likes, saves, comments, push_subscriptions
  await db.delete(users).where(eq(users.id, id))

  return NextResponse.json({ success: true })
}
