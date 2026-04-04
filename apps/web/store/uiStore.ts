import { create } from 'zustand'

interface UIStore {
  drawerOpen: boolean
  modalOpen: boolean
  activeCompanionId: string | null
  bookingModalOpen: boolean
  // Dreamer avatar — set on profile load, updated on avatar change
  avatarUrl: string | null
  openDrawer: () => void
  closeDrawer: () => void
  openModal: (companionId: string) => void
  closeModal: () => void
  openBookingModal: () => void
  closeBookingModal: () => void
  setAvatarUrl: (url: string | null) => void

  // Confessions feed
  activeStoryId: string | null
  openComments: (storyId: string) => void
  closeComments: () => void
  // unmutedStoryIds — audio is OFF by default; add an id to unmute
  unmutedStoryIds: Set<string>
  toggleMute: (storyId: string) => void
  isMuted: (storyId: string) => boolean
}

export const useUIStore = create<UIStore>((set, get) => ({
  drawerOpen: false,
  modalOpen: false,
  activeCompanionId: null,
  bookingModalOpen: false,
  avatarUrl: null,

  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),

  openModal: (companionId) => set({ modalOpen: true, activeCompanionId: companionId }),
  closeModal: () => set({ modalOpen: false, activeCompanionId: null }),

  openBookingModal: () => set({ bookingModalOpen: true }),
  closeBookingModal: () => set({ bookingModalOpen: false }),

  setAvatarUrl: (url) => set({ avatarUrl: url }),

  // Confessions
  activeStoryId: null,
  openComments: (storyId) => set({ activeStoryId: storyId }),
  closeComments: () => set({ activeStoryId: null }),

  unmutedStoryIds: new Set<string>(),
  toggleMute: (storyId) => set((s) => {
    const next = new Set(s.unmutedStoryIds)
    if (next.has(storyId)) next.delete(storyId)
    else next.add(storyId)
    return { unmutedStoryIds: next }
  }),
  isMuted: (storyId) => !get().unmutedStoryIds.has(storyId),
}))
