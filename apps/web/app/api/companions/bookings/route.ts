import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, bookingRequests, users, sessionCards } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companion.id),
  })
  if (!profile) return NextResponse.json({ bookings: [] })

  const rows = await db.select({
    id:                         bookingRequests.id,
    status:                     bookingRequests.status,
    requested_date:             bookingRequests.requested_date,
    requested_time:             bookingRequests.requested_time,
    requested_duration_minutes: bookingRequests.requested_duration_minutes,
    message:                    bookingRequests.message,
    price_quoted:               bookingRequests.price_quoted,
    currency:                   bookingRequests.currency,
    created_at:                 bookingRequests.created_at,
    user_alias:                 users.alias,
    session_title:              sessionCards.title,
    session_type:               sessionCards.session_type,
  })
    .from(bookingRequests)
    .leftJoin(users,        eq(bookingRequests.user_id,        users.id))
    .leftJoin(sessionCards, eq(bookingRequests.session_card_id, sessionCards.id))
    .where(eq(bookingRequests.companion_profile_id, profile.id))
    .orderBy(desc(bookingRequests.created_at))

  return NextResponse.json({ bookings: rows })
}
