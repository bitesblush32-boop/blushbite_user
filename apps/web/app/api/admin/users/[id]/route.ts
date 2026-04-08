import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, userProfiles, stories } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.platform_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = params

  const [[userRow], [profileRow], recentStories] = await Promise.all([
    db.select({
      id:                  users.id,
      email:               users.email,
      alias:               users.alias,
      name:                users.name,
      image:               users.image,
      onboarding_complete: users.onboarding_complete,
      is_flagged:          users.is_flagged,
      deleted_at:          users.deleted_at,
      created_at:          users.created_at,
      story_count:   sql<number>`(SELECT COUNT(*)::int FROM stories WHERE author_user_id = ${users.id})`,
      like_count:    sql<number>`(SELECT COUNT(*)::int FROM likes WHERE user_id = ${users.id})`,
      save_count:    sql<number>`(SELECT COUNT(*)::int FROM saves WHERE user_id = ${users.id})`,
      booking_count: sql<number>`(SELECT COUNT(*)::int FROM booking_requests WHERE user_id = ${users.id})`,
    }).from(users).where(eq(users.id, id)).limit(1),

    db.select({
      gender:         userProfiles.gender,
      vibes:          userProfiles.vibes,
      mood_intensity: userProfiles.mood_intensity,
      display_name:   userProfiles.display_name,
    }).from(userProfiles).where(eq(userProfiles.user_id, id)).limit(1),

    db.select({
      id:                stories.id,
      title:             stories.title,
      created_at:        stories.created_at,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.platform_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
    await db
      .update(users)
      .set({ deleted_at: null, updated_at: new Date() })
      .where(eq(users.id, id))
    return NextResponse.json({ success: true })
  }

  if (action === 'flag') {
    await db
      .update(users)
      .set({ is_flagged: true, updated_at: new Date() })
      .where(eq(users.id, id))
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
