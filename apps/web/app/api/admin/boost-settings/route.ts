import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  try {
    const [row] = await db.execute(sql`
      SELECT
        header_banner_enabled,
        right_rail_enabled,
        mid_grid_enabled,
        featured_enabled,
        price_featured_eur::text       AS price_featured_eur,
        price_header_banner_eur::text  AS price_header_banner_eur,
        price_right_rail_eur::text     AS price_right_rail_eur,
        price_mid_grid_eur::text       AS price_mid_grid_eur,
        max_weeks_advance
      FROM boost_settings WHERE id = 1
    `)
    if (!row) return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    return NextResponse.json({ data: row })
  } catch (err) {
    console.error('[admin/boost-settings/get] DB error:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const {
    header_banner_enabled,
    right_rail_enabled,
    mid_grid_enabled,
    featured_enabled,
    price_featured_eur,
    price_header_banner_eur,
    price_right_rail_eur,
    price_mid_grid_eur,
    max_weeks_advance,
  } = body as Record<string, unknown>

  try {
    const [row] = await db.execute(sql`
      UPDATE boost_settings SET
        header_banner_enabled   = COALESCE(${header_banner_enabled ?? null}::boolean,  header_banner_enabled),
        right_rail_enabled      = COALESCE(${right_rail_enabled ?? null}::boolean,     right_rail_enabled),
        mid_grid_enabled        = COALESCE(${mid_grid_enabled ?? null}::boolean,       mid_grid_enabled),
        featured_enabled        = COALESCE(${featured_enabled ?? null}::boolean,       featured_enabled),
        price_featured_eur      = COALESCE(${price_featured_eur ?? null}::numeric,     price_featured_eur),
        price_header_banner_eur = COALESCE(${price_header_banner_eur ?? null}::numeric,price_header_banner_eur),
        price_right_rail_eur    = COALESCE(${price_right_rail_eur ?? null}::numeric,   price_right_rail_eur),
        price_mid_grid_eur      = COALESCE(${price_mid_grid_eur ?? null}::numeric,     price_mid_grid_eur),
        max_weeks_advance       = COALESCE(${max_weeks_advance ?? null}::integer,      max_weeks_advance)
      WHERE id = 1
      RETURNING
        header_banner_enabled, right_rail_enabled, mid_grid_enabled, featured_enabled,
        price_featured_eur::text, price_header_banner_eur::text,
        price_right_rail_eur::text, price_mid_grid_eur::text,
        max_weeks_advance
    `)
    if (!row) return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    return NextResponse.json({ ok: true, data: row })
  } catch (err) {
    console.error('[admin/boost-settings/patch] DB error:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }
}
