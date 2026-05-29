'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import type { CompanionFeedItem } from '@/app/api/companions/feed/route'
import type { Companion } from '@/lib/types'

interface FeedPage {
  items:      CompanionFeedItem[]
  nextCursor: string | null
}

async function fetchFeedPage({ pageParam }: { pageParam: unknown }): Promise<FeedPage> {
  const cursor = pageParam as string | null
  const url = cursor
    ? `/api/companions/feed?cursor=${encodeURIComponent(cursor)}`
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
    photoUrl: item.primaryPhotoUrl,
  }
}

export function useRecommendedCompanions() {
  const query = useInfiniteQuery<
    FeedPage,
    Error,
    InfiniteData<FeedPage>,
    readonly unknown[],
    string | null
  >({
    queryKey:         ['companions', 'feed'] as const,
    queryFn:          fetchFeedPage,
    initialPageParam: null,
    getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor ?? null,
    staleTime:        5 * 60 * 1000,
    gcTime:           10 * 60 * 1000,
    maxPages:         5,
  })

  const companions: CompanionFeedItem[] = query.data?.pages.flatMap((p: FeedPage) => p.items) ?? []

  return {
    companions,
    companionCards:  companions.map(toCompanionCard),
    isLoading:       query.isLoading,
    isFetchingMore:  query.isFetchingNextPage,
    hasNextPage:     query.hasNextPage,
    fetchNextPage:   query.fetchNextPage,
    error:           query.error,
  }
}
