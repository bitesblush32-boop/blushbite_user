import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string
  notification_type: string
  title: string
  body: string
  action_url: string | null
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export interface Notification {
  id: string
  type: string
  content_type: string | null
  content_id: string | null
  is_read: boolean
  created_at: string
  actor: {
    alias: string
    image: string | null
  }
}

interface NotificationsResponse {
  notifications: Notification[]
  unread_count: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge count (poll every 30s)
// ─────────────────────────────────────────────────────────────────────────────

export function useNotificationCount() {
  const { data } = useQuery<{ unread: number }>({
    queryKey: ['notifications', 'count'],
    queryFn: () =>
      fetch('/api/notifications/count', { credentials: 'include' }).then((r) => r.json()),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
  return (data?.unread ?? 0) as number
}

// alias kept for callers that imported the old name
export { useNotificationCount as useNotificationCountQ }

// ─────────────────────────────────────────────────────────────────────────────
// Full list with optimistic markRead
// ─────────────────────────────────────────────────────────────────────────────

export function useNotificationsWithMarkRead() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications', { credentials: 'include' }).then((r) => r.json()),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const markRead = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return
      // Optimistic update
      queryClient.setQueryData<NotificationsResponse>(['notifications'], (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          unread_count: Math.max(0, (prev.unread_count ?? 0) - ids.length),
          notifications: (prev.notifications ?? []).map((n: any) =>
            ids.includes(n.id) ? { ...n, is_read: true } : n
          ),
        }
      })
      await fetch('/api/notifications', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: ids }),
      })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    [queryClient]
  )

  return {
    notifications: (data?.notifications ?? []) as unknown as NotificationItem[],
    unreadCount: (data?.unread_count ?? 0) as number,
    isLoading,
    markRead,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared read-only hook (used by dreamer notifications page)
// ─────────────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications', { credentials: 'include' }).then((r) => r.json()),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unread_count ?? 0,
    isLoading,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      fetch('/api/notifications/read-all', { method: 'PATCH' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).then((r) => r.json()),

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const prev = queryClient.getQueryData<NotificationsResponse>(['notifications'])

      queryClient.setQueryData<NotificationsResponse>(['notifications'], (old) => {
        if (!old) return old
        return {
          ...old,
          notifications: old.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
          unread_count: Math.max(
            0,
            old.unread_count - (old.notifications.find((n) => n.id === id)?.is_read ? 0 : 1)
          ),
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
