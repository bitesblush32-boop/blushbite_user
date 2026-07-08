'use client'

import { useState, useEffect, useCallback } from 'react'
import { getFingerprint } from '@/lib/fingerprint'

const LS_KEY = 'bb_community'
const VALID = new Set(['female', 'male', 'shemale'])

interface DeviceCommunity {
  community: string | null
  loading: boolean
  needsPicker: boolean
  bindCommunity: (chosen: string) => Promise<void>
}

export function useDeviceCommunity(): DeviceCommunity {
  const [community, setCommunity] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsPicker, setNeedsPicker] = useState(false)

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
        // localStorage unavailable
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
        // Network error — fall through
      }

      // Layer 3 — no binding found → show gender picker
      if (!cancelled) { setNeedsPicker(true); setLoading(false) }
    }

    resolve()
    return () => { cancelled = true }
  }, [])

  const bindCommunity = useCallback(async (chosen: string) => {
    if (!VALID.has(chosen)) return

    // Optimistic UI update
    setCommunity(chosen)
    setNeedsPicker(false)

    try { localStorage.setItem(LS_KEY, chosen) } catch { /* ignore */ }

    try {
      const fp = await getFingerprint()
      await fetch('/api/device/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint_hash: fp, community: chosen }),
      })
    } catch { /* best effort */ }
  }, [])

  return { community, loading, needsPicker, bindCommunity }
}
