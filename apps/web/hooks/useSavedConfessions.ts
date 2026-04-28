import { useInfiniteQuery } from '@tanstack/react-query'

export interface SavedPost {
  id:         string
  title:      string | null
  excerpt:    string | null
  firstImage: string | null
  categories: string[]
  authorType: string   // 'user' | 'companion' | 'admin'
  likeCount:  number
  saveCount:  number
  savedAt:    string
}

interface Page {
  data:       SavedPost[]
  nextCursor: string | null
}

async function fetchSaved(cursor?: string): Promise<Page> {
  const url = cursor
    ? `/api/users/saved/confessions?cursor=${encodeURIComponent(cursor)}`
    : '/api/users/saved/confessions'
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch saved confessions')
  return res.json()
}

export function useSavedConfessions() {
  const query = useInfiniteQuery<Page, Error>({
    queryKey:         ['saved', 'confessions'],
    queryFn:          ({ pageParam }) => fetchSaved(pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime:        5 * 60 * 1000,
    gcTime:           10 * 60 * 1000,
  })

  const items = query.data?.pages.flatMap(p => p.data) ?? []

  return {
    items,
    total:         items.length,
    fetchNextPage: query.fetchNextPage,
    hasNextPage:   query.hasNextPage,
    isLoading:     query.isLoading,
    isFetching:    query.isFetching,
  }
}
