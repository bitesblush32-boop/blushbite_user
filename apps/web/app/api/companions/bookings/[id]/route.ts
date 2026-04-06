import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, bookingRequests } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const profile = await db.query.companionProfiles.findFirst({
    where: eq(companionProfiles.companion_id, companion.id),
  })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { status } = await req.json()
  const allowed = ['accepted', 'declined', 'completed']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const [updated] = await db.update(bookingRequests)
    .set({ status, updated_at: new Date() })
    .where(and(
      eq(bookingRequests.id, params.id),
      eq(bookingRequests.companion_profile_id, profile.id),
    ))
    .returning({ id: bookingRequests.id })

  if (!updated) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
