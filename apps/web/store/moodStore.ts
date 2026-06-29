import { create } from 'zustand'

let _debounceTimer: ReturnType<typeof setTimeout> | null = null

interface MoodStore {
  intensity: number
  setIntensity: (v: number) => void
}

export const useMoodStore = create<MoodStore>((set) => ({
  intensity: 50,
  setIntensity: (v) => {
    set({ intensity: v })

    // Debounce PATCH to server — skip during SSR
    if (typeof window === 'undefined') return
    if (_debounceTimer) clearTimeout(_debounceTimer)
    _debounceTimer = setTimeout(() => {
      fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood_intensity: v }),
      }).catch(() => {
        /* silent — mood sync is best-effort */
      })
    }, 800)
  },
}))
