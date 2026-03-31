'use client'

import { useEffect, useRef } from 'react'
import type { VerificationResult } from '@didit-protocol/sdk-web'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  verificationUrl: string
  onComplete: (result: VerificationResult) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
// Renders null — the SDK owns its own modal UI.
// Must be loaded via next/dynamic({ ssr: false }) — SDK references browser
// globals at import time.

export default function DiditVerify({ verificationUrl, onComplete }: Props) {
  // Guard against React StrictMode's simulated unmount/remount:
  // StrictMode mounts → runs effect → unmounts → runs cleanup → remounts.
  // Without this ref the cleanup would call destroy() before the user ever
  // sees the modal, causing the "running" message to show with nothing open.
  // The ref persists across the StrictMode remount so startVerification() is
  // only called once per real component instance.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    let alive = true

    async function start() {
      const { DiditSdk } = await import('@didit-protocol/sdk-web')
      if (!alive) return

      DiditSdk.shared.onComplete = (result: VerificationResult) => {
        if (alive) onComplete(result)
      }

      await DiditSdk.shared.startVerification({ url: verificationUrl })
    }

    start().catch(err => {
      console.error('[DiditVerify] start error:', err)
      if (alive) {
        onComplete({ type: 'failed', error: { type: 'unknown', message: String(err) } })
      }
    })

    return () => {
      alive = false
      // Do NOT call destroy() here.
      // React StrictMode's cleanup fires on the simulated unmount — calling
      // destroy() would kill the modal before the user interacts with it.
      // The SDK closes itself when the user completes, cancels, or fails.
    }
  }, [verificationUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
