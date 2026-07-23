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

  const statusFilter =
    status === 'all'
      ? sql`TRUE`
      : sql`cb.status = ${status}`

  try {
    const [rows, [countRow], [headerRow], [railRow], [featuredRow], [revenueRow]] =
      await Promise.all([
        db.execute(sql`
          SELECT
            cb.id,
            cb.companion_id,
            cb.boost_type,
            cb.community,
            cb.week_start::text    AS week_start,
            cb.week_end::text      AS week_end,
            cb.price_eur::text     AS price_eur,
            cb.status,
            cb.payment_status,
            cb.is_enabled,
            cb.banner_headline,
            cb.banner_tagline,
            cb.created_at::text    AS created_at,
            c.name                 AS companion_name,
            c.email                AS companion_email,
            c.alias                AS companion_alias
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
        // active header_banner this week
        db.execute(sql`
          SELECT COUNT(*)::int AS n FROM companion_boosts
          WHERE boost_type = 'header_banner' AND status = 'active'
            AND week_start <= CURRENT_DATE AND week_end >= CURRENT_DATE
        `),
        // active right_rail this week
        db.execute(sql`
          SELECT COUNT(*)::int AS n FROM companion_boosts
          WHERE boost_type = 'right_rail' AND status = 'active'
            AND week_start <= CURRENT_DATE AND week_end >= CURRENT_DATE
        `),
        // active featured slots this week
        db.execute(sql`
          SELECT COUNT(*)::int AS n FROM companion_boosts
          WHERE boost_type LIKE 'featured_%' AND status = 'active'
            AND week_start <= CURRENT_DATE AND week_end >= CURRENT_DATE
        `),
        // total revenue from active boosts this week
        db.execute(sql`
          SELECT COALESCE(SUM(price_eur), 0)::text AS total FROM companion_boosts
          WHERE status = 'active'
            AND week_start <= CURRENT_DATE AND week_end >= CURRENT_DATE
        `),
      ])

    return NextResponse.json({
      data: rows,
      meta: { total: countRow?.n ?? 0, page, limit },
      stats: {
        header_active: headerRow?.n ?? 0,
        rail_active: railRow?.n ?? 0,
        featured_active: featuredRow?.n ?? 0,
        revenue_this_week: revenueRow?.total ?? '0',
      },
    })
  } catch (err) {
    console.error('[admin/boosts] DB error:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }
}
