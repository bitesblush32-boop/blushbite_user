import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import type { Story } from './useInfiniteConfessions'

interface FeedPage {
  items: Story[]
  nextCursor: { score: number; id: string } | null
}

interface Args {
  storyId: string
  currentlyLiked: boolean
}

export function useLikeMutation() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, Args, { snapshot: unknown }>({
    mutationKey: ['like'],
    mutationFn: async ({ storyId, currentlyLiked }) => {
      const res = await fetch(`/api/stories/${storyId}/like`, {
        method: currentlyLiked ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error('Failed to update like')
      return res.json()
    },
    onMutate: async ({ storyId, currentlyLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['confessions'] })
      const snapshot = queryClient.getQueryData(['confessions', 'feed'])

      queryClient.setQueryData<InfiniteData<FeedPage>>(['confessions', 'feed'], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((s) =>
              s.id === storyId
                ? {
                    ...s,
                    userHasLiked: !currentlyLiked,
                    likeCount: s.likeCount + (currentlyLiked ? -1 : 1),
                  }
                : s
            ),
          })),
        }
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(['confessions', 'feed'], ctx.snapshot)
      }
    },
    onSettled: () => {
      const inFlight = queryClient.isMutating({ mutationKey: ['like'] })
      if (inFlight <= 1) {
        queryClient.invalidateQueries({ queryKey: ['confessions'] })
      }
    },
  })
}
