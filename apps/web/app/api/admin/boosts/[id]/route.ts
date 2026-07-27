import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { status } = body as { status?: string }

  const VALID = ['active', 'cancelled', 'expired']
  if (!status || !VALID.includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status. Use: active | cancelled | expired' },
      { status: 400 }
    )
  }

  try {
    const [row] = await db.execute(sql`
      UPDATE companion_boosts SET status = ${status}
      WHERE id = ${id}
      RETURNING id, status, boost_type, community
    `)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, ...row })
  } catch (err) {
    console.error('[admin/boosts/patch] DB error:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { id } = await params

  try {
    await db.execute(sql`DELETE FROM companion_boosts WHERE id = ${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/boosts/delete] DB error:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }
}
