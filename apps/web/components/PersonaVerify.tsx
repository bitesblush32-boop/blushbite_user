'use client'

import { useEffect, useRef } from 'react'

// ─── Persona SDK types (lightweight — avoids importing full SDK at module level) ──

interface PersonaClient {
  open:    () => void
  destroy: () => void
}

interface PersonaClientOptions {
  inquiryId?:     string
  sessionToken?:  string | null
  templateId?:    string
  environmentId?: string
  onReady?:    () => void
  onComplete?: (data: { inquiryId: string; status: string; fields: Record<string, unknown> }) => void
  onCancel?:   (data: { sessionToken: string | null }) => void
  onError?:    (error: { code: string; message: string }) => void
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  inquiryId:    string | null
  sessionToken: string | null
  onComplete:   () => void
  onCancel:     () => void
  onError:      (code: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
// Renders null — Persona manages its own iframe modal.
// Parent must load this via next/dynamic({ ssr: false }) because the SDK
// references `self` (a browser-only global).

export default function PersonaVerify({
  inquiryId,
  sessionToken,
  onComplete,
  onCancel,
  onError,
}: Props) {
  const clientRef = useRef<PersonaClient | null>(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      // Dynamic import keeps the SDK out of the SSR bundle entirely
      const { Client } = (await import('persona')) as {
        Client: new (opts: PersonaClientOptions) => PersonaClient
      }

      if (!mounted) return

      const sharedCallbacks: Pick<PersonaClientOptions, 'onComplete' | 'onCancel' | 'onError'> = {
        onComplete: () => { if (mounted) onComplete() },

        onCancel: ({ sessionToken: st }) => {
          // Persist session token so the user can resume if they re-open
          if (st) {
            try { localStorage.setItem('persona_session_token', st) } catch { /* storage blocked */ }
          }
          if (mounted) onCancel()
        },

        onError: (err) => { if (mounted) onError(err.code) },
      }

      const opts: PersonaClientOptions = inquiryId
        // Resume an existing inquiry
        ? {
            inquiryId,
            sessionToken,
            onReady: () => clientRef.current?.open(),
            ...sharedCallbacks,
          }
        // Start a fresh inquiry from a template
        : {
            templateId:    process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID,
            environmentId: process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID,
            onReady: () => clientRef.current?.open(),
            ...sharedCallbacks,
          }

      const client = new Client(opts)
      clientRef.current = client
    }

    init().catch(err => {
      console.error('[PersonaVerify] init error:', err)
      onError('init_failed')
    })

    return () => {
      mounted = false
      clientRef.current?.destroy()
      clientRef.current = null
    }
  }, [inquiryId, sessionToken]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
