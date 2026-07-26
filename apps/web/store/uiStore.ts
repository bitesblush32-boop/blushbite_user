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

// ── Dreamer session (lightweight, shared across app) ───────────────────────

export interface DreamerUser {
  id: string
  email: string
  alias: string | null
}

// ── UIStore ────────────────────────────────────────────────────────────────

interface UIStore {
  // Dreamer avatar — set on profile load, updated on avatar change
  avatarUrl: string | null
  setAvatarUrl: (url: string | null) => void

  // Dreamer auth
  dreamer: DreamerUser | null
  dreamerLoading: boolean
  setDreamer: (d: DreamerUser | null) => void
  setDreamerLoading: (v: boolean) => void
  // Auth modal
  authModalOpen: boolean
  authModalIntent: 'contact' | 'interact' | null
  openAuthModal: (intent?: 'contact' | 'interact') => void
  closeAuthModal: () => void

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
  avatarUrl: null,

  setAvatarUrl: (url) => set({ avatarUrl: url }),

  // Dreamer auth
  dreamer: null,
  dreamerLoading: true,
  setDreamer: (d) => set({ dreamer: d }),
  setDreamerLoading: (v) => set({ dreamerLoading: v }),
  authModalOpen: false,
  authModalIntent: null,
  openAuthModal: (intent) => set({ authModalOpen: true, authModalIntent: intent ?? null }),
  closeAuthModal: () => set({ authModalOpen: false, authModalIntent: null }),

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
