'use client'

import { memo } from 'react'
import { Bookmark } from 'lucide-react'
import { useUIStore, type ProfileViewerStory } from '@/store/uiStore'
import type { SavedPost } from '@/hooks/useSavedConfessions'

interface Props {
  items: SavedPost[]
}

const SavedConfessionsGrid = memo(function SavedConfessionsGrid({ items }: Props) {
  const openProfileViewer = useUIStore(s => s.openProfileViewer)
  const openModal         = useUIStore(s => s.openModal)

  function handleItemTap(idx: number) {
    const item = items[idx]
    if (!item) return

    // Companion saves: open ProfileDrawer
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
        userHasLiked:  false,
        userHasSaved:  true,
        authorAlias:   null,
        isAnonymous:   false,
        createdAt:     i.savedAt,
      }))

    const storyItems = items.filter(i => i.authorType !== 'companion')
    const storyIdx   = storyItems.findIndex(i => i.id === item.id)
    const openIdx    = storyIdx >= 0 ? storyIdx : 0

    openProfileViewer(storiesArray, openIdx, 'saved')
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Bookmark size={32} color="#1c2333" />
        <p style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
          Nothing saved yet. Bookmark a confession to find it here.
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
          style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
        >
          {item.firstImage ? (
            <img
              src={item.firstImage}
              alt={item.title ?? 'Saved confession'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #111620, #1c2333)',
            }} />
          )}

          {/* Bottom overlay with excerpt */}
          <div style={{
            position:   'absolute',
            bottom:     0,
            left:       0,
            right:      0,
            background: 'linear-gradient(transparent, rgba(7,9,15,0.88))',
            padding:    '20px 6px 6px',
          }}>
            {item.excerpt && (
              <p style={{
                fontSize:            10,
                color:               '#eeeef0',
                lineHeight:          1.45,
                margin:              0,
                overflow:            'hidden',
                display:             '-webkit-box',
                WebkitLineClamp:     2,
                WebkitBoxOrient:     'vertical',
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

export { SavedConfessionsGrid }
