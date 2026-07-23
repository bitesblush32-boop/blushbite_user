import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const offset = (page - 1) * limit

  try {
    const statusFilter =
      status === 'all'
        ? sql`TRUE`
        : sql`cb.status = ${status}`

    const [rows, [countRow], [headerRow], [railRow], [revenueRow]] = await Promise.all([
      db.execute(sql`
        SELECT
          cb.id,
          cb.companion_id,
          cb.slot_type,
          cb.week_start,
          cb.week_end,
          cb.status,
          cb.amount_paid::text AS amount_paid,
          cb.currency,
          cb.notes,
          cb.created_at,
          c.name AS companion_name,
          c.email AS companion_email,
          c.alias AS companion_alias
        FROM companion_boosts cb
        JOIN companions c ON c.id = cb.companion_id
        WHERE ${statusFilter}
        ORDER BY cb.week_start DESC, cb.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS n
        FROM companion_boosts cb
        WHERE ${statusFilter}
      `),
      // active header banner slots this week
      db.execute(sql`
        SELECT COUNT(*)::int AS n
        FROM companion_boosts
        WHERE slot_type = 'header_banner'
          AND status = 'active'
          AND week_start <= CURRENT_DATE
          AND week_end >= CURRENT_DATE
      `),
      // active right_rail slots this week
      db.execute(sql`
        SELECT COUNT(*)::int AS n
        FROM companion_boosts
        WHERE slot_type = 'right_rail'
          AND status = 'active'
          AND week_start <= CURRENT_DATE
          AND week_end >= CURRENT_DATE
      `),
      // revenue this week (active boosts only)
      db.execute(sql`
        SELECT COALESCE(SUM(amount_paid), 0)::text AS total
        FROM companion_boosts
        WHERE status = 'active'
          AND week_start <= CURRENT_DATE
          AND week_end >= CURRENT_DATE
      `),
    ])

    return NextResponse.json({
      data: rows,
      meta: {
        total: countRow?.n ?? 0,
        page,
        limit,
      },
      stats: {
        header_active: headerRow?.n ?? 0,
        rail_active: railRow?.n ?? 0,
        revenue_this_week: revenueRow?.total ?? '0',
      },
    })
  } catch (err) {
    console.error('[admin/boosts] DB error:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }
}
