import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { bookingRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { status, admin_note } = await req.json()
  if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })

  const allowed = ['accepted', 'declined', 'completed', 'cancelled']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  await db
    .update(bookingRequests)
    .set({
      status,
      companion_notes: admin_note ?? undefined,
      updated_at: new Date(),
    })
    .where(eq(bookingRequests.id, params.id))

  return NextResponse.json({ success: true })
}
