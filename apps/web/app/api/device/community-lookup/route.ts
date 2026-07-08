import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { deviceCommunityBindings } from '@/db/schema'
import { eq } from 'drizzle-orm'

const FP_RE = /^[0-9a-f]{64}$/

export async function POST(req: NextRequest) {
  let fingerprint_hash: string | undefined
  try {
    const body = await req.json()
    fingerprint_hash = body?.fingerprint_hash
  } catch {
    return NextResponse.json({ found: false })
  }

  if (!fingerprint_hash || !FP_RE.test(fingerprint_hash)) {
    return NextResponse.json({ found: false })
  }

  const rows = await db
    .select({ community: deviceCommunityBindings.community })
    .from(deviceCommunityBindings)
    .where(eq(deviceCommunityBindings.fingerprint_hash, fingerprint_hash))
    .limit(1)

  if (rows.length === 0) return NextResponse.json({ found: false })

  // Fire-and-forget last_seen update
  db.update(deviceCommunityBindings)
    .set({ last_seen: new Date() })
    .where(eq(deviceCommunityBindings.fingerprint_hash, fingerprint_hash))
    .catch(() => {})

  return NextResponse.json({ found: true, community: rows[0].community })
}
