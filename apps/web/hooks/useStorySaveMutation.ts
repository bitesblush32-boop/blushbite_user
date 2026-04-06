import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import type { Story } from './useInfiniteConfessions'

interface FeedPage { items: Story[]; nextCursor: { score: number; id: string } | null }

interface Args { storyId: string; currentlySaved: boolean }

export function useStorySaveMutation() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, Args, { snapshot: unknown }>({
    mutationKey: ['story-save'],
    mutationFn: async ({ storyId, currentlySaved }) => {
      const res = await fetch(`/api/stories/${storyId}/save`, {
        method: currentlySaved ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error('Failed to update save')
      return res.json()
    },
    onMutate: async ({ storyId, currentlySaved }) => {
      await queryClient.cancelQueries({ queryKey: ['stories'] })
      const snapshot = queryClient.getQueryData(['stories', 'feed'])

      queryClient.setQueryData<InfiniteData<FeedPage>>(
        ['stories', 'feed'],
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              items: page.items.map(s =>
                s.id === storyId
                  ? {
                      ...s,
                      userHasSaved: !currentlySaved,
                      saveCount: s.saveCount + (currentlySaved ? -1 : 1),
                    }
                  : s
              ),
            })),
          }
        }
      )
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(['stories', 'feed'], ctx.snapshot)
      }
    },
    onSettled: () => {
      const inFlight = queryClient.isMutating({ mutationKey: ['story-save'] })
      if (inFlight <= 1) {
        queryClient.invalidateQueries({ queryKey: ['stories'] })
      }
    },
  })
}
