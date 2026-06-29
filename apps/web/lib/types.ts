export interface Companion {
  id: string
  name: string
  age: number
  city: string
  price: string
  vibe: string
  tags: string[]
  gradient: string
  photoUrl?: string | null
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

export interface Audio {
  id: string
  title: string
  voice: string
  duration: string
  vibe: string
  tags: string[]
  gradient: string
}

export interface CompanionFeedItem {
  id: string
  companionId: string
  name: string | null
  age: number | null
  city: string | null
  minPrice: string | null
  currency: string
  vibe: string | null
  tags: string[]
  primaryPhotoUrl: string | null
  gradient: string
  isVerified: boolean
  sessionModality: string
  overlapScore: number
  distance_km?: number | null
  gender?: string | null
  height_cm?: number | null
  body_type?: string | null
}
