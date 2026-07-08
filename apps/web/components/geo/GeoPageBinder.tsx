'use client'

import { useEffect } from 'react'
import { getFingerprint } from '@/lib/fingerprint'

const LS_KEY = 'bb_community'
const VALID = new Set(['female', 'male', 'shemale'])

/**
 * Invisible client component — auto-binds the device to a gender community
 * when the user lands on a gender-specific geo page (e.g. /shemale/india/pune).
 * Writes to localStorage + DB. No UI rendered.
 */
export default function GeoPageBinder({ gender }: { gender: string }) {
  useEffect(() => {
    if (!VALID.has(gender)) return

    async function bind() {
      // Already bound to same community — nothing to do
      try {
        const cached = localStorage.getItem(LS_KEY)
        if (cached === gender) return
      } catch { /* ignore */ }

      try {
        const fp = await getFingerprint()
        await fetch('/api/device/bind', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint_hash: fp, community: gender }),
        })
        localStorage.setItem(LS_KEY, gender)
      } catch { /* best effort */ }
    }

    bind()
  }, [gender])

  return null
}
