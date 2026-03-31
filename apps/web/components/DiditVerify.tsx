'use client'

import { useEffect } from 'react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  sessionToken:    string
  verificationUrl: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (session: any) => void
  onCancel:  () => void
  onError:   (code: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
// Component renders null — the SDK owns its own modal UI.
// Must be loaded via next/dynamic({ ssr: false }) — SDK references browser globals.

export default function DiditVerify({
  sessionToken,
  verificationUrl,
  onSuccess,
  onCancel,
  onError,
}: Props) {
  useEffect(() => {
    let mounted = true

    async function init() {
      // .default is required — SDK uses a default export with dynamic import()
      const DiditSdk = (await import('@didit-protocol/sdk-web')).default

      if (!mounted) return

      DiditSdk.init({
        session_token: sessionToken,
        onSuccess: (session: unknown) => { if (mounted) onSuccess(session) },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError:   (error: any)        => { if (mounted) onError(error?.code ?? 'unknown') },
        onCancel:  ()                  => { if (mounted) onCancel() },
      })

      DiditSdk.startVerification({ url: verificationUrl })
    }

    init().catch(err => {
      console.error('[DiditVerify] init error:', err)
      onError('init_failed')
    })

    return () => {
      mounted = false
      try {
        import('@didit-protocol/sdk-web')
          .then(m => { m.default.destroy?.() })
          .catch(() => {})
      } catch { /* no-op */ }
    }
  }, [sessionToken, verificationUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
