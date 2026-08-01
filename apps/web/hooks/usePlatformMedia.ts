import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export interface PlatformMediaItem {
  id: string
  mediaType: 'video' | 'photo'
  url: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  profileId: string
  companionName: string | null
  city: string | null
}

interface MediaPage {
  items: PlatformMediaItem[]
  nextCursor: { created_at: string; id: string } | null
  videoCount?: number
  photoCount?: number
}

type Cursor = { created_at: string; id: string } | null

async function fetchMedia(cursor: Cursor): Promise<MediaPage> {
  const params = new URLSearchParams({ limit: '12' })
  if (cursor) params.set('cursor', JSON.stringify(cursor))
  const res = await fetch(`/api/platform-media?${params}`)
  if (!res.ok) throw new Error('Failed to load media')
  return res.json()
}

export function usePlatformMedia() {
  const query = useInfiniteQuery<MediaPage, Error, { pages: MediaPage[] }, string[], Cursor>({
    queryKey: ['media', 'feed'],
    queryFn: ({ pageParam }) => fetchMedia(pageParam),
    initialPageParam: null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    maxPages: 5,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  )

  // Counts only live on the first page
  const videoCount = query.data?.pages[0]?.videoCount ?? 0
  const photoCount = query.data?.pages[0]?.photoCount ?? 0

  return {
    items,
    videoCount,
    photoCount,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    status: query.status,
  }
}
