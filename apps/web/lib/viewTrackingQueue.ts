interface ViewEvent {
  storyId: string
  viewedAt: number
  duration: number
}

let queue: ViewEvent[] = []
let started = false

export function enqueueView(storyId: string) {
  queue.push({ storyId, viewedAt: Date.now(), duration: 0 })
}

export async function flush() {
  if (queue.length === 0) return
  const batch = queue.splice(0, queue.length)
  try {
    await fetch('/api/stories/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ views: batch }),
    })
  } catch {
    queue = [...batch, ...queue]
  }
}

export function startTracking() {
  if (started || typeof window === 'undefined') return
  started = true
  setInterval(flush, 10_000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && queue.length > 0) {
      const blob = new Blob([JSON.stringify({ views: queue })], { type: 'application/json' })
      navigator.sendBeacon('/api/stories/views', blob)
      queue = []
    }
  })
}
