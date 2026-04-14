'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export type BridgeStatus = 'idle' | 'pending' | 'approved' | 'rejected'

export function useBridgeMutation(storyId: string) {
  const { data: session } = useSession()
  const isCompanion =
    (session?.user as any)?.platform_role === 'companion' ||
    (session?.user as any)?.platform_role === 'dream'

  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>('idle')
  const [loading, setLoading]           = useState(false)

  // Check existing bridge status on mount (companions only)
  useEffect(() => {
    if (!isCompanion || !storyId) return
    fetch(`/api/companion/bridge?story_id=${storyId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.bridged && data.status) {
          setBridgeStatus(data.status as BridgeStatus)
        }
      })
      .catch(() => {})
  }, [isCompanion, storyId])

  const bridge = async () => {
    if (!isCompanion || loading || bridgeStatus !== 'idle') return
    setLoading(true)
    setBridgeStatus('approved') // optimistic — auto-approved
    try {
      const res = await fetch('/api/companion/bridge', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ story_id: storyId }),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.already_linked) {
        setBridgeStatus((data.status as BridgeStatus) ?? 'idle')
      } else if (data.success) {
        setBridgeStatus('approved')
      } else {
        setBridgeStatus('idle')
      }
    } catch {
      setBridgeStatus('idle')
    } finally {
      setLoading(false)
    }
  }

  return { isCompanion, bridgeStatus, loading, bridge }
}
