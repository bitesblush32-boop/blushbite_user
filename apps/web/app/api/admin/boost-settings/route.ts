import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  try {
    const rows = await db.execute(sql`
      SELECT slot_type, price_per_week::text AS price_per_week, max_slots_per_week, currency, is_active
      FROM boost_settings
      ORDER BY slot_type
    `)
    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[admin/boost-settings/get] DB error:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const { slot_type, price_per_week, max_slots_per_week, is_active } = body as {
    slot_type?: string
    price_per_week?: number
    max_slots_per_week?: number
    is_active?: boolean
  }

  if (!slot_type) {
    return NextResponse.json({ error: 'slot_type is required' }, { status: 400 })
  }

  try {
    const [row] = await db.execute(sql`
      UPDATE boost_settings SET
        price_per_week      = COALESCE(${price_per_week ?? null}::numeric, price_per_week),
        max_slots_per_week  = COALESCE(${max_slots_per_week ?? null}::integer, max_slots_per_week),
        is_active           = COALESCE(${is_active ?? null}::boolean, is_active),
        updated_at          = NOW()
      WHERE slot_type = ${slot_type}
      RETURNING slot_type, price_per_week::text AS price_per_week, max_slots_per_week, currency, is_active
    `)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, data: row })
  } catch (err) {
    console.error('[admin/boost-settings/patch] DB error:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }
}
