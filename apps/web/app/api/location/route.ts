import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, companions, companionProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

const schema = z.object({
  latitude:  z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

// ── POST /api/location — persist coordinates for the current user/companion ───

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { latitude, longitude } = parsed.data
  const email = session.user.email
  const now   = new Date()

  // Try dreamer side
  const userRow = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (userRow.length) {
    await db.update(users).set({
      latitude:            latitude.toFixed(8),
      longitude:           longitude.toFixed(8),
      location_enabled:    true,
      location_updated_at: now,
    }).where(eq(users.email, email))
  }

  // Try companion side
  const companionRow = await db
    .select({ id: companions.id })
    .from(companions)
    .where(eq(companions.email, email))
    .limit(1)

  if (companionRow.length) {
    const profileRow = await db
      .select({ id: companionProfiles.id })
      .from(companionProfiles)
      .where(eq(companionProfiles.companion_id, companionRow[0].id))
      .limit(1)

    if (profileRow.length) {
      await db.update(companionProfiles).set({
        latitude:            latitude.toFixed(8),
        longitude:           longitude.toFixed(8),
        location_enabled:    true,
        location_updated_at: now,
      }).where(eq(companionProfiles.id, profileRow[0].id))
    }
  }

  return NextResponse.json({ ok: true })
}

// ── GET /api/location — return stored location for current user/companion ─────

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = session.user.email

  const userRow = await db
    .select({
      latitude:         users.latitude,
      longitude:        users.longitude,
      location_enabled: users.location_enabled,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (userRow.length) {
    return NextResponse.json({
      latitude:         userRow[0].latitude  ? parseFloat(userRow[0].latitude)  : null,
      longitude:        userRow[0].longitude ? parseFloat(userRow[0].longitude) : null,
      location_enabled: userRow[0].location_enabled,
    })
  }

  return NextResponse.json({ latitude: null, longitude: null, location_enabled: false })
}
