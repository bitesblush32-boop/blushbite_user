import { useInfiniteQuery } from '@tanstack/react-query'

export interface LikedItem {
  id:         string
  title:      string | null
  excerpt:    string | null
  firstImage: string | null
  categories: string[]
  authorType: string
  likeCount:  number
  saveCount:  number
  likedAt:    string
}

interface Page {
  data:       LikedItem[]
  nextCursor: string | null
}

type ContentType = 'all' | 'confessions' | 'stories'

async function fetchLiked(type: ContentType, cursor?: string): Promise<Page> {
  const params = new URLSearchParams({ type })
  if (cursor) params.set('cursor', cursor)
  const res = await fetch(`/api/users/liked?${params}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch liked content')
  return res.json()
}

export function useLikedContent(type: ContentType) {
  const query = useInfiniteQuery<Page, Error>({
    queryKey:         ['liked', type],
    queryFn:          ({ pageParam }) => fetchLiked(type, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const items = query.data?.pages.flatMap(p => p.data) ?? []

  return {
    items,
    fetchNextPage: query.fetchNextPage,
    hasNextPage:   query.hasNextPage,
    isLoading:     query.isLoading,
    isFetching:    query.isFetching,
  }
}
