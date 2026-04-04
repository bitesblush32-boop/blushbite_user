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

export interface Audio {
  id: string
  title: string
  voice: string
  duration: string
  vibe: string
  tags: string[]
  gradient: string
}
