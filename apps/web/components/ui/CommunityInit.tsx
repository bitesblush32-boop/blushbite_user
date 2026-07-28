'use client'

// Runs once on mount — resolves device community and seeds uiStore.community.
// Mounted lazily in DreamerLayout alongside DreamerSessionInit.

import { useEffect } from 'react'
import { useDeviceCommunity } from '@/hooks/useDeviceCommunity'
import { useUIStore } from '@/store/uiStore'

export default function CommunityInit() {
  const { community, loading } = useDeviceCommunity()
  const setCommunity = useUIStore((s) => s.setCommunity)
  const setCommunityLoading = useUIStore((s) => s.setCommunityLoading)

  useEffect(() => {
    setCommunity(community)
    setCommunityLoading(loading)
  }, [community, loading, setCommunity, setCommunityLoading])

  return null
}
