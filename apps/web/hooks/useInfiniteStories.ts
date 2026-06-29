import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Story } from './useInfiniteConfessions'

// PlatformStory is structurally identical to Story — same API shape, different cache
export type { Story as PlatformStory }

interface FeedPage {
  items: Story[]
  nextCursor: { score: number; id: string } | null
}

type Cursor = { score: number; id: string } | null

async function fetchStories(cursor: Cursor): Promise<FeedPage> {
  const params = new URLSearchParams({ limit: '5' })
  if (cursor) params.set('cursor', JSON.stringify(cursor))
  const res = await fetch(`/api/platform-stories?${params}`)
  if (!res.ok) throw new Error('Failed to load stories')
  return res.json()
}

export function useInfiniteStories() {
  const query = useInfiniteQuery<FeedPage, Error, { pages: FeedPage[] }, string[], Cursor>({
    queryKey: ['stories', 'feed'],
    queryFn: ({ pageParam }) => fetchStories(pageParam),
    initialPageParam: null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    maxPages: 10,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const storyList = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])

  return {
    stories: storyList,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    status: query.status,
  }
}
