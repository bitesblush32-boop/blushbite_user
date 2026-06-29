import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export interface Story {
  id: string
  title: string
  authorAlias: string | null
  isAnonymous: boolean
  body: string
  rawBody: string
  pageImageUrls: string[]
  excerpt: string
  likeCount: number
  saveCount: number
  viewCount: number
  commentCount: number
  userHasLiked: boolean
  userHasSaved: boolean
  moodTags: string[]
  categoryName: string
  publishedAt: string | null
  relevanceScore: number
}

interface FeedPage {
  items: Story[]
  nextCursor: { score: number; id: string } | null
}

type Cursor = { score: number; id: string } | null

async function fetchConfessions(cursor: Cursor): Promise<FeedPage> {
  const params = new URLSearchParams({ limit: '5' })
  if (cursor) params.set('cursor', JSON.stringify(cursor))
  const res = await fetch(`/api/confessions?${params}`)
  if (!res.ok) throw new Error('Failed to load confessions')
  return res.json()
}

export function useInfiniteConfessions() {
  const query = useInfiniteQuery<FeedPage, Error, { pages: FeedPage[] }, string[], Cursor>({
    queryKey: ['confessions', 'feed'],
    queryFn: ({ pageParam }) => fetchConfessions(pageParam),
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
