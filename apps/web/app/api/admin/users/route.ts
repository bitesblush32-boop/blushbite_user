import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { users, userProfiles } from '@/db/schema'
import { eq, ne, ilike, or, and, isNull, isNotNull, desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const filter = searchParams.get('filter') ?? 'all'
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit  = 25
  const offset = (page - 1) * limit

  // Never expose admin accounts in the dreamer list
  const conditions: any[] = [
    or(isNull(userProfiles.platform_role), ne(userProfiles.platform_role, 'admin'))
  ]

  if (search) {
    conditions.push(
      or(
        ilike(users.alias, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.name,  `%${search}%`),
      )
    )
  }

  if (filter === 'flagged') {
    conditions.push(eq(users.is_flagged, true))
  } else if (filter === 'active') {
    conditions.push(isNull(users.deleted_at))
  } else if (filter === 'banned') {
    conditions.push(isNotNull(users.deleted_at))
  }

  const where = conditions.length ? and(...conditions) : undefined

  const [rows, countRows] = await Promise.all([
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
      gender:              userProfiles.gender,
      vibes:               userProfiles.vibes,
      mood_intensity:      userProfiles.mood_intensity,
      story_count:   sql<number>`(SELECT COUNT(*)::int FROM stories WHERE author_user_id = ${users.id})`,
      like_count:    sql<number>`(SELECT COUNT(*)::int FROM likes WHERE user_id = ${users.id})`,
      save_count:    sql<number>`(SELECT COUNT(*)::int FROM saves WHERE user_id = ${users.id})`,
      booking_count: sql<number>`(SELECT COUNT(*)::int FROM booking_requests WHERE user_id = ${users.id})`,
    })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.user_id, users.id))
      .where(where)
      .orderBy(desc(users.created_at))
      .limit(limit)
      .offset(offset),

    db.select({ n: sql<number>`count(*)::int` })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.user_id, users.id))
      .where(where),
  ])

  return NextResponse.json({
    data: rows,
    meta: {
      total: Number(countRows[0]?.n ?? 0),
      page,
      limit,
    },
  })
}
