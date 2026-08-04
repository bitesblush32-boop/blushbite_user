import { db } from '@/db'
import { sql } from 'drizzle-orm'

export interface CommunityFlags {
  female_enabled: boolean
  male_enabled: boolean
}

// Module-level cache — no Edge-incompatible imports, just a JS object
let _cache: { flags: CommunityFlags; at: number } | null = null
const TTL_MS = 60_000 // 60 seconds

export async function getCommunityFlags(): Promise<CommunityFlags> {
  const now = Date.now()
  if (_cache && now - _cache.at < TTL_MS) return _cache.flags

  try {
    const [row] = await db.execute(sql`
      SELECT female_enabled, male_enabled FROM boost_settings WHERE id = 1
    `)
    const flags: CommunityFlags = {
      female_enabled: (row as Record<string, unknown>)?.female_enabled !== false,
      male_enabled: (row as Record<string, unknown>)?.male_enabled !== false,
    }
    _cache = { flags, at: now }
    return flags
  } catch {
    // On DB error, default to enabled (safe fallback)
    return { female_enabled: true, male_enabled: true }
  }
}

/** Call this after admin PATCH to bust the in-process cache immediately */
export function bustCommunityFlagsCache() {
  _cache = null
}
