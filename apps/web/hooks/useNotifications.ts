import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Notification {
  id:           string
  type:         string
  content_type: string | null
  content_id:   string | null
  is_read:      boolean
  created_at:   string
  actor: {
    alias: string
    image: string | null
  }
}

interface NotificationsResponse {
  notifications: Notification[]
  unread_count:  number
}

export function useNotifications() {
  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn:  () => fetch('/api/notifications').then(r => r.json()),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  })

  return {
    notifications: data?.notifications ?? [],
    unreadCount:   data?.unread_count  ?? 0,
    isLoading,
  }
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      fetch('/api/notifications/read-all', { method: 'PATCH' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).then(r => r.json()),

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const prev = queryClient.getQueryData<NotificationsResponse>(['notifications'])

      queryClient.setQueryData<NotificationsResponse>(['notifications'], old => {
        if (!old) return old
        return {
          ...old,
          notifications: old.notifications.map(n =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unread_count: Math.max(0, old.unread_count - (old.notifications.find(n => n.id === id)?.is_read ? 0 : 1)),
        }
      })

      return { prev }
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['notifications'], ctx.prev)
      }
    },
  })
}
