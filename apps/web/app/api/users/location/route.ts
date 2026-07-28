import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/dreamerSession'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const UNAUTH = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return UNAUTH

  let lat: number, lng: number
  try {
    const body = await req.json()
    lat = typeof body.lat === 'number' ? body.lat : parseFloat(body.lat)
    lng = typeof body.lng === 'number' ? body.lng : parseFloat(body.lng)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (isNaN(lat) || lat < -90 || lat > 90)
    return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
  if (isNaN(lng) || lng < -180 || lng > 180)
    return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })

  // Save raw coords to users table (mirrors blushbite.live companion location route)
  await db
    .update(users)
    .set({
      latitude: String(lat),
      longitude: String(lng),
      location_enabled: true,
      location_updated_at: new Date(),
    })
    .where(eq(users.id, session.sub))

  // Reverse-geocode via Nominatim (no API key required)
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  const geoRes = await fetch(url, {
    headers: { 'User-Agent': 'BlushBite/1.0 (admin@blushbite.co)' },
  })

  if (!geoRes.ok) {
    return NextResponse.json({ data: { city: null, country: null } })
  }

  const data: any = await geoRes.json()
  const addr = data?.address ?? {}
  const city: string | null =
    addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state ?? null
  const country: string | null = addr.country ?? null

  return NextResponse.json({ data: { city, country } })
}
