import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const { ids } = body as { ids?: string[] }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 })
  }
  if (ids.length > 100) {
    return NextResponse.json({ error: 'Cannot delete more than 100 at once' }, { status: 400 })
  }

  try {
    const result = await db.execute(sql`
      DELETE FROM companion_boosts WHERE id = ANY(${ids}::uuid[])
      RETURNING id
    `)
    return NextResponse.json({ ok: true, deleted: (result as any[]).length })
  } catch (err) {
    console.error('[admin/boosts/bulk] DB error:', err)
    return NextResponse.json({ error: 'database_error' }, { status: 500 })
  }
}
