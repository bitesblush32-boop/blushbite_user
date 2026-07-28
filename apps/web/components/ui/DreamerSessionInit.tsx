'use client'

// Runs once on mount — fetches /api/users/me and seeds dreamer state in uiStore.
// Mounted lazily in DreamerLayout so it never blocks SSR.

import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

export default function DreamerSessionInit() {
  const { setDreamer, setDreamerLoading, setRequiresSetup, openAuthModal } = useUIStore()

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          const alias = data.user.alias ?? null
          setDreamer({ id: data.user.id, email: data.user.email, alias })
          // Gate: logged-in user with no alias must pick one before proceeding
          if (!alias) {
            setRequiresSetup(true)
            openAuthModal()
          }
        } else {
          setDreamer(null)
        }
      })
      .catch(() => setDreamer(null))
      .finally(() => setDreamerLoading(false))
  }, [setDreamer, setDreamerLoading, setRequiresSetup, openAuthModal])

  return null
}
