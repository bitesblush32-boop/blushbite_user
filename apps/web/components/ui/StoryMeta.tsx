'use client'

interface Props {
  authorAlias: string | null
  isAnonymous: boolean
  moodTags: string[]
  categoryName: string
  body?: string
  rawBody?: string
  totalPages?: number
}

export function StoryMeta({ authorAlias, isAnonymous, moodTags, categoryName }: Props) {
  const displayTags = moodTags.slice(0, 2)

  return (
    <>
      {/* Bottom scrim — ensures text legibility */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          zIndex: 15,
          background: 'linear-gradient(transparent, rgba(7,9,15,0.92))',
        }}
      />

      {/* Meta */}
      <div
        className="absolute flex flex-col"
        style={{ bottom: 48, left: 16, right: 80, zIndex: 20, gap: 6 }}
      >
        {/* Author */}
        {isAnonymous || !authorAlias ? (
          <span style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
            Anonymous confession
          </span>
        ) : (
          <span style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>{authorAlias}</span>
        )}

        {/* Tags */}
        {(categoryName || displayTags.length > 0) && (
          <div className="flex items-center flex-wrap" style={{ gap: 5 }}>
            {categoryName && (
              <span
                style={{
                  fontSize: 11,
                  color: '#e8607a',
                  background: 'rgba(232,96,122,0.1)',
                  border: '1px solid rgba(232,96,122,0.3)',
                  padding: '2px 8px',
                  borderRadius: 9999,
                }}
              >
                {categoryName}
              </span>
            )}
            {displayTags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #1c2333',
                  padding: '2px 8px',
                  borderRadius: 9999,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
