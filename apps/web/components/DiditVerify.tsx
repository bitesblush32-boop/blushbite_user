'use client'

import { useEffect } from 'react'
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
  useEffect(() => {
    let mounted = true

    async function start() {
      const { DiditSdk } = await import('@didit-protocol/sdk-web')
      if (!mounted) return

      // SDK is a singleton accessed via DiditSdk.shared
      DiditSdk.shared.onComplete = (result: VerificationResult) => {
        if (mounted) onComplete(result)
      }

      await DiditSdk.shared.startVerification({ url: verificationUrl })
    }

    start().catch(err => {
      console.error('[DiditVerify] start error:', err)
      onComplete({ type: 'failed', error: { type: 'unknown', message: String(err) } })
    })

    return () => {
      mounted = false
      import('@didit-protocol/sdk-web')
        .then(({ DiditSdk }) => DiditSdk.shared.destroy())
        .catch(() => {})
    }
  }, [verificationUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
