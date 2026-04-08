import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, analyticsEvents } from '@/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isCompanion = session.user.platform_role === 'companion'
  if (!isCompanion) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Resolve companion_profile_id
  const companionRow = await db
    .select({ id: companions.id })
    .from(companions)
    .where(eq(companions.email, session.user.email))
    .limit(1)

  if (!companionRow.length) return NextResponse.json({ error: 'Companion not found' }, { status: 404 })

  const profileRow = await db
    .select({ id: companionProfiles.id, is_visible_to_users: companionProfiles.is_visible_to_users })
    .from(companionProfiles)
    .where(eq(companionProfiles.companion_id, companionRow[0].id))
    .limit(1)

  if (!profileRow.length) {
    return NextResponse.json({
      profile_views:    { today: 0, week: 0, month: 0 },
      whatsapp_clicks:  { month: 0 },
      bridge_clicks:    { month: 0 },
      chart:            [],
      is_visible_to_users: false,
    })
  }

  const profileId = profileRow[0].id

  // Time boundaries (UTC)
  const now       = new Date()
  const today     = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const weekAgo   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
  const monthAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const profileFilter = eq(analyticsEvents.companion_profile_id, profileId)

  const [
    viewsToday,
    viewsWeek,
    viewsMonth,
    waClicks,
    bridgeClicks,
    chartRows,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(analyticsEvents)
      .where(and(profileFilter, eq(analyticsEvents.event_type, 'profile_view'), gte(analyticsEvents.created_at, today)))
      .then(r => r[0]?.c ?? 0),

    db.select({ c: sql<number>`count(*)::int` }).from(analyticsEvents)
      .where(and(profileFilter, eq(analyticsEvents.event_type, 'profile_view'), gte(analyticsEvents.created_at, weekAgo)))
      .then(r => r[0]?.c ?? 0),

    db.select({ c: sql<number>`count(*)::int` }).from(analyticsEvents)
      .where(and(profileFilter, eq(analyticsEvents.event_type, 'profile_view'), gte(analyticsEvents.created_at, monthAgo)))
      .then(r => r[0]?.c ?? 0),

    db.select({ c: sql<number>`count(*)::int` }).from(analyticsEvents)
      .where(and(profileFilter, eq(analyticsEvents.event_type, 'whatsapp_click'), gte(analyticsEvents.created_at, monthAgo)))
      .then(r => r[0]?.c ?? 0),

    db.select({ c: sql<number>`count(*)::int` }).from(analyticsEvents)
      .where(and(profileFilter, eq(analyticsEvents.event_type, 'bridge_click'), gte(analyticsEvents.created_at, monthAgo)))
      .then(r => r[0]?.c ?? 0),

    db.select({
      day:   sql<string>`DATE(${analyticsEvents.created_at})::text`,
      views: sql<number>`count(*)::int`,
    }).from(analyticsEvents)
      .where(and(profileFilter, eq(analyticsEvents.event_type, 'profile_view'), gte(analyticsEvents.created_at, monthAgo)))
      .groupBy(sql`DATE(${analyticsEvents.created_at})`)
      .orderBy(sql`DATE(${analyticsEvents.created_at}) ASC`),
  ])

  return NextResponse.json({
    profile_views:       { today: viewsToday, week: viewsWeek, month: viewsMonth },
    whatsapp_clicks:     { month: waClicks },
    bridge_clicks:       { month: bridgeClicks },
    chart:               chartRows,
    is_visible_to_users: profileRow[0].is_visible_to_users,
  })
}
