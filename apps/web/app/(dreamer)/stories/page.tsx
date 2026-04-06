'use client'

import dynamic from 'next/dynamic'

const StoriesFeed = dynamic(
  () => import('@/components/ui/StoriesFeed').then(m => ({ default: m.StoriesFeed })),
  { ssr: false }
)

export default function StoriesPage() {
  return <StoriesFeed />
}
