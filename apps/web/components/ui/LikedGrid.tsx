'use client'

import { memo } from 'react'
import { Heart } from 'lucide-react'
import { useUIStore, type ProfileViewerStory } from '@/store/uiStore'
import type { LikedItem } from '@/hooks/useLikedContent'

interface Props {
  items:     LikedItem[]
  isLoading: boolean
}

const LikedGrid = memo(function LikedGrid({ items, isLoading }: Props) {
  const openProfileViewer = useUIStore(s => s.openProfileViewer)
  const openModal         = useUIStore(s => s.openModal)

  function handleItemTap(idx: number) {
    const item = items[idx]
    if (!item) return

    // For companion-type items: open the ProfileDrawer instead
    if (item.authorType === 'companion') {
      openModal(item.id)
      return
    }

    const storiesArray: ProfileViewerStory[] = items
      .filter(i => i.authorType !== 'companion')
      .map(i => ({
        id:            i.id,
        title:         i.title,
        body:          '',
        rawBody:       i.excerpt ?? '',
        pageImageUrls: [],
        categoryName:  i.categories[0] ?? '',
        categories:    i.categories,
        moodTags:      [],
        likeCount:     i.likeCount,
        saveCount:     i.saveCount,
        commentCount:  0,
        userHasLiked:  true,
        userHasSaved:  false,
        authorAlias:   null,
        isAnonymous:   false,
        createdAt:     i.likedAt,
      }))

    // Find the index within story-only items
    const storyItems = items.filter(i => i.authorType !== 'companion')
    const storyIdx   = storyItems.findIndex(i => i.id === item.id)
    const openIdx    = storyIdx >= 0 ? storyIdx : 0

    openProfileViewer(storiesArray, openIdx, 'liked')
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-[2px]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ aspectRatio: '3/4', background: '#111620', borderRadius: 4 }}
          />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Heart size={32} color="#1c2333" />
        <p style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
          Nothing liked yet. Heart a confession or story to find it here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {items.map((item, idx) => (
        <div
          key={item.id}
          onClick={() => handleItemTap(idx)}
          style={{
            aspectRatio:  '3/4',
            position:     'relative',
            overflow:     'hidden',
            borderRadius: 4,
            cursor:       'pointer',
          }}
        >
          {item.firstImage ? (
            <img
              src={item.firstImage}
              alt={item.title ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width:      '100%',
              height:     '100%',
              background: 'linear-gradient(135deg, #111620, #1c2333)',
            }} />
          )}

          {/* Bottom overlay with excerpt */}
          <div style={{
            position:   'absolute',
            bottom:     0,
            left:       0,
            right:      0,
            background: 'linear-gradient(transparent 50%, rgba(7,9,15,0.9) 100%)',
            padding:    '20px 8px 8px',
          }}>
            {item.excerpt && (
              <p style={{
                fontSize:        10,
                color:           '#eeeef0',
                lineHeight:      1.35,
                margin:          0,
                overflow:        'hidden',
                display:         '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {item.excerpt}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
})

export { LikedGrid }
