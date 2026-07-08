import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { deviceCommunityBindings } from '@/db/schema'

const VALID = ['female', 'male', 'shemale']
const FP_RE = /^[0-9a-f]{64}$/

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { fingerprint_hash, community } = body as Record<string, string>

  if (!fingerprint_hash || !FP_RE.test(fingerprint_hash))
    return NextResponse.json({ ok: false }, { status: 400 })
  if (!community || !VALID.includes(community))
    return NextResponse.json({ ok: false }, { status: 400 })

  await db
    .insert(deviceCommunityBindings)
    .values({ fingerprint_hash, community })
    .onConflictDoUpdate({
      target: deviceCommunityBindings.fingerprint_hash,
      set: { community, last_seen: new Date() },
    })

  return NextResponse.json({ ok: true })
}
