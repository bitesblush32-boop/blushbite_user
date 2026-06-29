import { create } from 'zustand'
import type { FontSize } from '@/lib/paginateText'

// ── ProfileViewerStory ─────────────────────────────────────────────────────

export interface ProfileViewerStory {
  id: string
  title: string | null
  body: string // raw JSON body string — same format as Story.body
  rawBody: string | null // plain text extracted for paginateText
  pageImageUrls: string[]
  categoryName: string
  categories: string[]
  moodTags: string[]
  likeCount: number
  saveCount: number
  commentCount: number
  userHasLiked: boolean
  userHasSaved: boolean
  authorAlias: string | null
  isAnonymous: boolean
  createdAt: string
}

// ── UIStore ────────────────────────────────────────────────────────────────

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

  // Profile viewer
  profileViewerStories: ProfileViewerStory[]
  profileViewerIndex: number
  profileViewerMode: 'own' | 'liked' | 'saved' | null
  openProfileViewer: (
    stories: ProfileViewerStory[],
    index: number,
    mode: 'own' | 'liked' | 'saved'
  ) => void
  closeProfileViewer: () => void

  // Confession reading preferences
  confessionFontSize: FontSize
  setConfessionFontSize: (s: FontSize) => void
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
  toggleMute: (storyId) =>
    set((s) => {
      const next = new Set(s.unmutedStoryIds)
      if (next.has(storyId)) next.delete(storyId)
      else next.add(storyId)
      return { unmutedStoryIds: next }
    }),
  isMuted: (storyId) => !get().unmutedStoryIds.has(storyId),

  // Profile viewer
  profileViewerStories: [],
  profileViewerIndex: 0,
  profileViewerMode: null,
  openProfileViewer: (stories, index, mode) =>
    set({ profileViewerStories: stories, profileViewerIndex: index, profileViewerMode: mode }),
  closeProfileViewer: () =>
    set({ profileViewerStories: [], profileViewerIndex: 0, profileViewerMode: null }),

  // Confession reading preferences
  confessionFontSize: 'md',
  setConfessionFontSize: (s) => set({ confessionFontSize: s }),
}))
