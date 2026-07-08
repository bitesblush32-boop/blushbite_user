'use client'

import { useState, useEffect } from 'react'
import { getFingerprint } from '@/lib/fingerprint'

const LS_KEY = 'bb_community'
const VALID = new Set(['female', 'male', 'shemale'])

export function useDeviceCommunity(): { community: string | null; loading: boolean } {
  const [community, setCommunity] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      // Layer 1 — localStorage cache
      try {
        const cached = localStorage.getItem(LS_KEY)
        if (cached && VALID.has(cached)) {
          if (!cancelled) { setCommunity(cached); setLoading(false) }
          return
        }
      } catch {
        // localStorage unavailable (private mode, etc.)
      }

      // Layer 2 — device fingerprint → DB lookup
      try {
        const fp = await getFingerprint()
        const res = await fetch('/api/device/community-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint_hash: fp }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.found && VALID.has(data.community)) {
            try { localStorage.setItem(LS_KEY, data.community) } catch { /* ignore */ }
            if (!cancelled) { setCommunity(data.community); setLoading(false) }
            return
          }
        }
      } catch {
        // Network error or fingerprint failure — fall through to null
      }

      // Layer 3 — no binding found; show all communities
      if (!cancelled) { setCommunity(null); setLoading(false) }
    }

    resolve()
    return () => { cancelled = true }
  }, [])

  return { community, loading }
}
