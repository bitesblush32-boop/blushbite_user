import { create } from 'zustand'

interface UIStore {
  drawerOpen: boolean
  modalOpen: boolean
  activeCompanionId: string | null
  bookingModalOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  openModal: (companionId: string) => void
  closeModal: () => void
  openBookingModal: () => void
  closeBookingModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  drawerOpen: false,
  modalOpen: false,
  activeCompanionId: null,
  bookingModalOpen: false,

  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),

  openModal: (companionId) => set({ modalOpen: true, activeCompanionId: companionId }),
  closeModal: () => set({ modalOpen: false, activeCompanionId: null }),

  openBookingModal: () => set({ bookingModalOpen: true }),
  closeBookingModal: () => set({ bookingModalOpen: false }),
}))
