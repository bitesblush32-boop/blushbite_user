'use client'

import { useEffect } from 'react'
import type { VerificationResult } from '@didit-protocol/sdk-web'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  sessionToken:    string           // passed through for SDK future use / logging
  verificationUrl: string
  onSuccess: (session: VerificationResult['session']) => void
  onCancel:  () => void
  onError:   (code: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
// Component renders null — the SDK owns its own modal UI.
// Must be loaded via next/dynamic({ ssr: false }) — SDK references browser
// globals at import time.

export default function DiditVerify({
  verificationUrl,
  onSuccess,
  onCancel,
  onError,
}: Props) {
  useEffect(() => {
    let mounted = true

    async function init() {
      // Dynamic import keeps the SDK out of the SSR bundle entirely
      const { DiditSdk } = await import('@didit-protocol/sdk-web')

      if (!mounted) return

      // SDK is a singleton accessed via DiditSdk.shared
      const sdk = DiditSdk.shared

      sdk.onComplete = (result: VerificationResult) => {
        if (!mounted) return
        if (result.type === 'completed') {
          onSuccess(result.session)
        } else if (result.type === 'cancelled') {
          onCancel()
        } else {
          onError(result.error?.type ?? 'unknown')
        }
      }

      await sdk.startVerification({ url: verificationUrl })
    }

    init().catch(err => {
      console.error('[DiditVerify] init error:', err)
      onError('init_failed')
    })

    return () => {
      mounted = false
      // Clean up SDK on unmount — destroy() removes the modal from the DOM
      import('@didit-protocol/sdk-web')
        .then(({ DiditSdk }) => { DiditSdk.shared.destroy() })
        .catch(() => {})
    }
  }, [verificationUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
