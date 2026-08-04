import { db } from '@/db'
import { sql } from 'drizzle-orm'

export interface CommunityFlags {
  female_enabled: boolean
  male_enabled: boolean
}

// Use Node.js global so the cache is shared across all webpack module instances
// (API route handlers and page Server Components are separate chunks in prod)
declare global {
  // eslint-disable-next-line no-var
  var __bb_community_flags: { flags: CommunityFlags; at: number } | null
}

const TTL_MS = 60_000 // 60 seconds

export async function getCommunityFlags(): Promise<CommunityFlags> {
  const now = Date.now()
  const cached = global.__bb_community_flags
  if (cached && now - cached.at < TTL_MS) return cached.flags

  try {
    const [row] = await db.execute(sql`
      SELECT female_enabled, male_enabled FROM boost_settings WHERE id = 1
    `)
    const flags: CommunityFlags = {
      female_enabled: (row as Record<string, unknown>)?.female_enabled !== false,
      male_enabled: (row as Record<string, unknown>)?.male_enabled !== false,
    }
    global.__bb_community_flags = { flags, at: now }
    return flags
  } catch {
    // Safe fallback — show all communities on DB error
    return { female_enabled: true, male_enabled: true }
  }
}

/** Call after admin PATCH to bust the shared in-process cache immediately */
export function bustCommunityFlagsCache() {
  global.__bb_community_flags = null
}
