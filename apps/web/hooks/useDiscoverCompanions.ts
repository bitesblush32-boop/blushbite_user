'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
export interface DiscoverCompanionItem {
  id: string
  companionId: string
  name: string | null
  age: number | null
  city: string | null
  distance_km: number | null
  minPrice: string | null
  currency: string
  vibe: string | null
  tags: string[]
  primaryPhotoUrl: string | null
  gradient: string
  isVerified: boolean
  sessionModality: string
  alias: string | null
}

interface DiscoverPage {
  items: DiscoverCompanionItem[]
  nextCursor: string | null
}

interface Props {
  lat: number | null
  lng: number | null
  radius?: number
  sessionKey?: number
  community?: string | null
  minAge?: number | null
  maxAge?: number | null
  enabled?: boolean
}

async function fetchDiscoverPage(
  { pageParam }: { pageParam: unknown },
  lat: number | null,
  lng: number | null,
  radius: number,
  community?: string | null,
  minAge?: number | null,
  maxAge?: number | null
): Promise<DiscoverPage> {
  const cursor = pageParam as string | null
  const params = new URLSearchParams()
  if (lat !== null && lng !== null) {
    params.set('lat', String(lat))
    params.set('lng', String(lng))
    params.set('radius', String(radius))
  }
  if (cursor) params.set('cursor', cursor)
  if (community) params.set('gender', community)
  if (minAge != null) params.set('minAge', String(minAge))
  if (maxAge != null) params.set('maxAge', String(maxAge))

  const url = `/api/companions/discover${params.toString() ? `?${params}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Discover fetch failed')
  return res.json()
}

export function useDiscoverCompanions({ lat, lng, radius = 100, sessionKey = 0, community, minAge, maxAge, enabled = true }: Props) {
  const query = useInfiniteQuery<
    DiscoverPage,
    Error,
    InfiniteData<DiscoverPage>,
    readonly unknown[],
    string | null
  >({
    queryKey: ['companions', 'discover', lat, lng, radius, sessionKey, community, minAge, maxAge] as const,
    queryFn: ({ pageParam }) => fetchDiscoverPage({ pageParam }, lat, lng, radius, community, minAge, maxAge),
    initialPageParam: null,
    getNextPageParam: (lastPage: DiscoverPage) => lastPage.nextCursor ?? null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    maxPages: 10,
    enabled,
  })

  const companions: DiscoverCompanionItem[] = query.data?.pages.flatMap((p) => p.items) ?? []

  return {
    companions,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    error: query.error,
  }
}
