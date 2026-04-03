export interface Companion {
  id: string
  name: string
  age: number
  city: string
  price: string
  vibe: string
  tags: string[]
  gradient: string
}

export interface Story {
  id: string
  title: string
  type: 'Story' | 'Confession'
  duration: string
  vibe: string
  tags: string[]
  handle: string
  gradient: string
}

export interface StoryReply {
  id: string
  alias: string
  avatarGradient: string
  text: string
  likes: number
  timeAgo: string
}

export interface StoryComment {
  id: string
  alias: string
  avatarGradient: string
  text: string
  likes: number
  timeAgo: string
  replies: StoryReply[]
}

export interface StoryFull extends Story {
  pages: string[]
  authorAlias: string
  postedAt: string
  likeCount: number
  saveCount: number
  commentCount: number
  comments: StoryComment[]
}

export interface Audio {
  id: string
  title: string
  voice: string
  duration: string
  vibe: string
  tags: string[]
  gradient: string
}
