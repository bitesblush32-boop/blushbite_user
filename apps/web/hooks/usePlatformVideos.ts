import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { PlatformVideo } from '@/components/ui/VideoCard'

export type { PlatformVideo }

interface FeedPage {
  items: PlatformVideo[]
  nextCursor: { created_at: string; id: string } | null
}

type Cursor = { created_at: string; id: string } | null

async function fetchVideos(cursor: Cursor): Promise<FeedPage> {
  const params = new URLSearchParams({ limit: '10' })
  if (cursor) params.set('cursor', JSON.stringify(cursor))
  const res = await fetch(`/api/platform-videos?${params}`)
  if (!res.ok) throw new Error('Failed to load videos')
  return res.json()
}

export function usePlatformVideos() {
  const query = useInfiniteQuery<FeedPage, Error, { pages: FeedPage[] }, string[], Cursor>({
    queryKey: ['videos', 'feed'],
    queryFn: ({ pageParam }) => fetchVideos(pageParam),
    initialPageParam: null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    maxPages: 5,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const videoList = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data])

  return {
    videos: videoList,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    status: query.status,
  }
}
