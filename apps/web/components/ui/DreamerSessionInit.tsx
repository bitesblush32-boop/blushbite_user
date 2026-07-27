'use client'

// Runs once on mount — fetches /api/users/me and seeds dreamer state in uiStore.
// Mounted lazily in DreamerLayout so it never blocks SSR.

import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

export default function DreamerSessionInit() {
  const { setDreamer, setDreamerLoading } = useUIStore()

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((data) => {
        setDreamer(
          data.user
            ? { id: data.user.id, email: data.user.email, alias: data.user.alias ?? null }
            : null
        )
      })
      .catch(() => setDreamer(null))
      .finally(() => setDreamerLoading(false))
  }, [setDreamer, setDreamerLoading])

  return null
}
