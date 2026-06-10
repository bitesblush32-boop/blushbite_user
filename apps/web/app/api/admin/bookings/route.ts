import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { bookingRequests, users, companionProfiles, companions, sessionCards } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all'
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit  = 20
  const offset = (page - 1) * limit

  const conditions: any[] = []
  if (['pending','accepted','completed','declined','cancelled'].includes(filter)) {
    conditions.push(eq(bookingRequests.status, filter))
  }
  const where = conditions.length ? and(...conditions) : undefined

  const [rows, countRows, statsRows] = await Promise.all([
    db.select({
      id:                         bookingRequests.id,
      status:                     bookingRequests.status,
      requested_date:             bookingRequests.requested_date,
      requested_time:             bookingRequests.requested_time,
      requested_duration_minutes: bookingRequests.requested_duration_minutes,
      message:                    bookingRequests.message,
      companion_notes:            bookingRequests.companion_notes,
      price_quoted:               bookingRequests.price_quoted,
      currency:                   bookingRequests.currency,
      created_at:                 bookingRequests.created_at,
      updated_at:                 bookingRequests.updated_at,
      user_alias:                 users.alias,
      companion_name:             companions.name,
      companion_alias:            companions.alias,
      city:                       companionProfiles.city,
      session_title:              sessionCards.title,
      session_type:               sessionCards.session_type,
    })
      .from(bookingRequests)
      .leftJoin(users, eq(users.id, bookingRequests.user_id))
      .leftJoin(companionProfiles, eq(companionProfiles.id, bookingRequests.companion_profile_id))
      .leftJoin(companions, eq(companions.id, companionProfiles.companion_id))
      .leftJoin(sessionCards, eq(sessionCards.id, bookingRequests.session_card_id))
      .where(where)
      .orderBy(desc(bookingRequests.created_at))
      .limit(limit)
      .offset(offset),

    db.select({ n: sql<number>`count(*)::int` })
      .from(bookingRequests)
      .where(where),

    // Status counts for stat tiles
    db.select({
      status: bookingRequests.status,
      n: sql<number>`count(*)::int`,
    })
      .from(bookingRequests)
      .groupBy(bookingRequests.status),
  ])

  const statusCounts: Record<string, number> = {}
  statsRows.forEach(r => { statusCounts[r.status] = Number(r.n) })

  return NextResponse.json({
    data: rows,
    meta: {
      total:     Number(countRows[0]?.n ?? 0),
      page,
      limit,
      pending:   statusCounts['pending']   ?? 0,
      accepted:  statusCounts['accepted']  ?? 0,
      completed: statusCounts['completed'] ?? 0,
      declined:  statusCounts['declined']  ?? 0,
      cancelled: statusCounts['cancelled'] ?? 0,
    },
  })
}
