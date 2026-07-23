import { NextResponse } from 'next/server'
import { db } from '@/db'
import { bookingRequests } from '@/db/schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { companion_profile_id, session_card_id, message, channel } = body

    if (!companion_profile_id) {
      return NextResponse.json({ error: 'companion_profile_id required' }, { status: 400 })
    }

    await db.insert(bookingRequests).values({
      companion_profile_id,
      user_id: null,
      session_card_id: session_card_id ?? null,
      channel: channel ?? null,
      message: message ?? null,
      status: 'pending',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/bookings] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
