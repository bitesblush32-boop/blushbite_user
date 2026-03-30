import { create } from 'zustand'

interface PlayerAudio {
  id: string
  title: string
  meta: string
}

interface PlayerStore {
  visible: boolean
  playing: boolean
  title: string
  meta: string
  progress: number
  audioId: string | null
  play: (audio: PlayerAudio) => void
  pause: () => void
  resume: () => void
  close: () => void
  setProgress: (p: number) => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  visible: false,
  playing: false,
  title: '',
  meta: '',
  progress: 0,
  audioId: null,

  play: (audio) =>
    set({
      visible: true,
      playing: true,
      audioId: audio.id,
      title: audio.title,
      meta: audio.meta,
      progress: 0,
    }),

  pause: () => set({ playing: false }),

  resume: () => set({ playing: true }),

  close: () =>
    set({
      visible: false,
      playing: false,
      audioId: null,
      title: '',
      meta: '',
      progress: 0,
    }),

  setProgress: (p) => set({ progress: p }),
}))
