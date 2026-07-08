import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { companions, companionProfiles, companionVerifications } from '@/db/schema'
import { eq, and, or, isNull, lt, gte, ilike, desc, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const sp = req.nextUrl.searchParams
  const filter = sp.get('filter') ?? 'all'
  const search = sp.get('search') ?? ''
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10))
  const limit = 20
  const offset = (page - 1) * limit

  const filters: SQL[] = []

  if (filter === 'new_today') {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    filters.push(gte(companions.created_at, since))
  } else if (filter === 'live') {
    filters.push(eq(companionProfiles.is_live, true))
  } else if (filter === 'rejected') {
    filters.push(sql`EXISTS (
      SELECT 1 FROM companion_onboarding_progress cop
      WHERE cop.companion_id = ${companions.id}
      AND cop.stage = 3 AND cop.status = 'rejected'
    )`)
  } else if (filter === 'incomplete') {
    filters.push(lt(companions.companion_stage, 3))
  }

  if (search) {
    filters.push(
      or(
        ilike(companions.email, `%${search}%`),
        ilike(companions.full_name, `%${search}%`),
        ilike(companions.alias, `%${search}%`)
      ) as SQL
    )
  }

  const whereClause = filters.length ? and(...filters) : undefined

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: companions.id,
        email: companions.email,
        alias: companions.alias,
        full_name: companions.full_name,
        date_of_birth: companions.date_of_birth,
        country: companions.country,
        companion_stage: companions.companion_stage,
        created_at: companions.created_at,
        profile_id: companionProfiles.id,
        city: companionProfiles.city,
        is_live: companionProfiles.is_live,
        approved_at: companionProfiles.approved_at,
        availability_status: companionProfiles.availability_status,
        provider_status: companionVerifications.provider_status,
        liveness_check_passed: companionVerifications.liveness_check_passed,
        photo_count: sql<number>`(SELECT COUNT(*) FROM companion_photos WHERE companion_profile_id = companion_profiles.id AND deleted_at IS NULL)::int`,
        video_count: sql<number>`(SELECT COUNT(*) FROM companion_videos WHERE companion_profile_id = companion_profiles.id AND deleted_at IS NULL)::int`,
      })
      .from(companions)
      .leftJoin(companionProfiles, eq(companionProfiles.companion_id, companions.id))
      .leftJoin(companionVerifications, eq(companionVerifications.companion_id, companions.id))
      .where(whereClause)
      .orderBy(desc(companions.created_at))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(companions)
      .leftJoin(companionProfiles, eq(companionProfiles.companion_id, companions.id))
      .leftJoin(companionVerifications, eq(companionVerifications.companion_id, companions.id))
      .where(whereClause),
  ])

  return NextResponse.json({
    data: rows,
    meta: { total: Number(countRows[0]?.count ?? 0), page, limit },
  })
}
