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
}

export const useUIStore = create<UIStore>((set) => ({
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
}))
