'use client'

import { useQuery } from '@tanstack/react-query'
import type { ActiveBoostItem } from '@/app/api/boosts/active/route'

export type { ActiveBoostItem }

const FEATURED_TYPES = ['featured_1', 'featured_2', 'featured_3']

export function useActiveBoosts(community: string | null) {
  const { data, isLoading } = useQuery<ActiveBoostItem[]>({
    queryKey: ['boosts', 'active', community],
    queryFn: async () => {
      if (!community) return []
      const res = await fetch(`/api/boosts/active?community=${encodeURIComponent(community)}`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!community,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const boosts = data ?? []

  return {
    headerBanner: boosts.find((b) => b.boost_type === 'header_banner') ?? null,
    featuredBoosts: boosts.filter((b) => FEATURED_TYPES.includes(b.boost_type)),
    rightRailBoosts: boosts.filter((b) => b.boost_type === 'right_rail'),
    midGridBoost: boosts.find((b) => b.boost_type === 'mid_grid') ?? null,
    isLoading,
  }
}
