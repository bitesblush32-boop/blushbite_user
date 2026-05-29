'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { CompanionFeedItem } from '@/app/api/companions/feed/route'
import type { Companion } from '@/lib/types'

interface FeedPage {
  items:      CompanionFeedItem[]
  nextCursor: string | null
}

async function fetchFeedPage({ pageParam }: { pageParam: string | null }): Promise<FeedPage> {
  const url = pageParam
    ? `/api/companions/feed?cursor=${encodeURIComponent(pageParam)}`
    : '/api/companions/feed'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Feed fetch failed')
  return res.json()
}

// Map CompanionFeedItem → Companion (legacy shape for CompanionCard)
export function toCompanionCard(item: CompanionFeedItem): Companion {
  return {
    id:       item.id,
    name:     item.name ?? 'Unknown',
    age:      item.age ?? 0,
    city:     item.city ?? '',
    price:    item.minPrice ?? '—',
    vibe:     item.vibe ?? '',
    tags:     item.tags,
    gradient: item.gradient,
  }
}

export function useRecommendedCompanions() {
  const query = useInfiniteQuery<FeedPage, Error>({
    queryKey:        ['companions', 'feed'],
    queryFn:         fetchFeedPage,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime:       5 * 60 * 1000,   // 5 min
    gcTime:          10 * 60 * 1000,  // 10 min
    maxPages:        5,
  })

  const companions = query.data?.pages.flatMap(p => p.items) ?? []

  return {
    companions,
    companionCards: companions.map(toCompanionCard),
    isLoading:     query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    hasNextPage:   query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error:         query.error,
  }
}
