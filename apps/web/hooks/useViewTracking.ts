'use client'

import { useEffect, useRef, useCallback } from 'react'
import { enqueueView, startTracking } from '@/lib/viewTrackingQueue'

export function useViewTracking(minViewDuration = 2000) {
  const viewedIds = useRef<Set<string>>(new Set())
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const observers = useRef<Map<string, IntersectionObserver>>(new Map())

  useEffect(() => {
    startTracking()
  }, [])

  const observe = useCallback(
    (storyId: string, el: HTMLElement | null) => {
      // Disconnect any previous observer for this id
      const existing = observers.current.get(storyId)
      if (existing) {
        existing.disconnect()
        observers.current.delete(storyId)
      }
      if (!el) return

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              if (viewedIds.current.has(storyId)) return
              const timer = setTimeout(() => {
                viewedIds.current.add(storyId)
                enqueueView(storyId)
              }, minViewDuration)
              timers.current.set(storyId, timer)
            } else {
              const timer = timers.current.get(storyId)
              if (timer) {
                clearTimeout(timer)
                timers.current.delete(storyId)
              }
            }
          }
        },
        { threshold: 0.5 }
      )
      observer.observe(el)
      observers.current.set(storyId, observer)
    },
    [minViewDuration]
  )

  useEffect(() => {
    const currentTimers = timers.current
    const currentObservers = observers.current
    return () => {
      Array.from(currentTimers.values()).forEach((t) => clearTimeout(t))
      Array.from(currentObservers.values()).forEach((o) => o.disconnect())
    }
  }, [])

  return { observe }
}
