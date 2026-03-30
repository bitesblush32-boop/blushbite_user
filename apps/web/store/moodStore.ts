import { create } from 'zustand'

interface MoodStore {
  intensity: number
  setIntensity: (v: number) => void
}

export const useMoodStore = create<MoodStore>((set) => ({
  intensity: 50,
  setIntensity: (v) => set({ intensity: v }),
}))
