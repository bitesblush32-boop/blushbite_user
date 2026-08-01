'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePlatformAudio } from '@/hooks/usePlatformAudio'
import type { Story as StaticStory, Companion } from '@/lib/types'
import { useRecommendedCompanions } from '@/hooks/useRecommendedCompanions'
import { useDeviceCommunity } from '@/hooks/useDeviceCommunity'
import { useInfiniteStories } from '@/hooks/useInfiniteStories'
import { useInfiniteConfessions } from '@/hooks/useInfiniteConfessions'
import { usePlatformMedia } from '@/hooks/usePlatformMedia'
import { useActiveBoosts } from '@/hooks/useActiveBoosts'
import { HeaderBannerAd, FeaturedBoostCard, MidGridAd, RightRailAd, SectionDividerAd } from '@/components/ui/BoostAds'
import { usePlayerStore } from '@/store/playerStore'
import { useUIStore } from '@/store/uiStore'
import CompanionCard from '@/components/ui/CompanionCard'
import StoryCard from '@/components/ui/StoryCard'
import AudioCard from '@/components/ui/AudioCard'
import VideoCard from '@/components/ui/VideoCard'
import GenderPickerOverlay from '@/components/GenderPickerOverlay'
import type { Story as ApiStory } from '@/hooks/useInfiniteConfessions'

// ─── Framer Motion stagger variants ───────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Gradient helper (deterministic from id) ──────────────────────────────────

const STORY_GRADIENTS = [
  'linear-gradient(135deg,#1a0e20,#2a1540,#1a1220)',
  'linear-gradient(135deg,#0f1628,#1a1040,#1a0e20)',
  'linear-gradient(135deg,#201228,#1a2030,#2a1a18)',
  'linear-gradient(135deg,#0a1620,#1a1535,#201a10)',
  'linear-gradient(135deg,#1a1020,#2a1530,#101820)',
  'linear-gradient(135deg,#101820,#201028,#102020)',
]

function gradientFromId(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return STORY_GRADIENTS[hash % STORY_GRADIENTS.length]
}

// ─── Map API story → StaticStory for StoryCard ────────────────────────────────

function mapToCard(s: ApiStory, type: 'Story' | 'Confession'): StaticStory {
  const wordCount = (s.rawBody ?? '').split(' ').filter(Boolean).length
  const mins = Math.max(1, Math.ceil(wordCount / 200))
  return {
    id: s.id,
    title: s.title,
    type,
    duration: `${mins} min`,
    vibe: s.moodTags[0] ?? s.categoryName ?? 'Intimate',
    tags: s.moodTags.slice(0, 3),
    handle: s.isAnonymous ? 'Anonymous' : s.authorAlias ? `@${s.authorAlias}` : 'Anonymous',
    gradient: gradientFromId(s.id),
  }
}

// ─── HomePageContent ──────────────────────────────────────────────────────────
// Accepts an optional forceCommunity — used by /female, /male, /shemale pages
// to pre-bind the device and skip the community picker.

export default function HomePageContent({ forceCommunity }: { forceCommunity?: string }) {
  const play = usePlayerStore((s) => s.play)
  const { community, loading, needsPicker, bindCommunity } = useDeviceCommunity(forceCommunity)
  const setCommunity = useUIStore((s) => s.setCommunity)
  const setCommunityLoading = useUIStore((s) => s.setCommunityLoading)

  // Sync to global store so all pages (header, companions, etc.) can read it without re-resolving
  useEffect(() => {
    setCommunity(community)
    setCommunityLoading(loading)
  }, [community, loading, setCommunity, setCommunityLoading])
  const { companionCards, isLoading: companionsLoading } = useRecommendedCompanions(community)

  const { stories: platformStoriesRaw, status: storiesStatus } = useInfiniteStories()
  const { stories: confessionsRaw, status: confessionsStatus } = useInfiniteConfessions()
  const { items: platformVideos, videoCount, photoCount, status: videosStatus } = usePlatformMedia()
  const { items: audioItems } = usePlatformAudio()
  const { headerBanner, featuredBoosts, rightRailBoosts, midGridBoost, sectionDividerBoost } = useActiveBoosts(community)

  const router = useRouter()

  const hotFeedRef = useRef<HTMLDivElement>(null)
  const hotFeedPaused = useRef(false)

  useEffect(() => {
    const el = hotFeedRef.current
    if (!el || platformVideos.length === 0) return
    const id = setInterval(() => {
      if (hotFeedPaused.current) return
      const card = el.firstElementChild as HTMLElement
      const cardW = card ? card.offsetWidth + 12 : 240
      const maxScroll = el.scrollWidth - el.clientWidth
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollTo({ left: el.scrollLeft + cardW, behavior: 'smooth' })
      }
    }, 3000)
    return () => clearInterval(id)
  }, [platformVideos])

  // Auto-slide for promoted right-rail carousel (mobile)
  const railRef = useRef<HTMLDivElement>(null)
  const railPaused = useRef(false)

  useEffect(() => {
    const el = railRef.current
    if (!el || rightRailBoosts.length <= 1) return
    const id = setInterval(() => {
      if (railPaused.current) return
      const cardW = 200 + 16 // card width + gap
      const maxScroll = el.scrollWidth - el.clientWidth
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollTo({ left: el.scrollLeft + cardW, behavior: 'smooth' })
      }
    }, 3000)
    return () => clearInterval(id)
  }, [rightRailBoosts])

  const [activeFilter, setActiveFilter] = useState<'All' | 'Story' | 'Confession'>('All')
  // Map to static card shape
  const platformStoryCards = platformStoriesRaw.map((s) => mapToCard(s, 'Story'))
  const confessionCards = confessionsRaw.map((s) => mapToCard(s, 'Confession'))

  const filteredStories =
    activeFilter === 'All'
      ? [...platformStoryCards, ...confessionCards]
      : activeFilter === 'Story'
        ? platformStoryCards
        : confessionCards

  const bridgeItems = confessionCards.flatMap((confession, i) => [
    { kind: 'story' as const, item: confession },
    ...(companionCards.length > 0
      ? [{ kind: 'companion' as const, item: companionCards[i % companionCards.length] }]
      : []),
  ])

  const storiesLoading = storiesStatus === 'pending' || confessionsStatus === 'pending'
  const hasAnyStories = platformStoryCards.length > 0 || confessionCards.length > 0

  // Pre-build companion carousel items with optional mid-grid sponsored card at position 3
  const companionItems: ReactNode[] = []
  if (!companionsLoading) {
    companionCards.forEach((c, idx) => {
      if (idx === 3 && midGridBoost) {
        companionItems.push(
          <motion.div
            key={`sponsored-${midGridBoost.id}`}
            variants={cardItem}
            style={{ scrollSnapAlign: 'start', flexShrink: 0, width: 198 }}
          >
            <MidGridAd data={midGridBoost} />
          </motion.div>
        )
      }
      companionItems.push(
        <motion.div
          key={c.id}
          variants={cardItem}
          style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
        >
          <CompanionCard companion={c} />
        </motion.div>
      )
    })
  }

  // First live story for mood panel
  const moodStory = platformStoryCards[0] ?? null

  return (
    <>
      {needsPicker && <GenderPickerOverlay onSelect={bindCommunity} />}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-[1400px] mx-auto px-5 md:px-6 pt-[95px] pb-20"
      >
        {/* ── Header Banner ad placement ──────────────────────────────────────── */}
        {headerBanner && <HeaderBannerAd data={headerBanner} />}

        {/* ── 🔥 Hot Media Feed — auto-scroll carousel ─────────────────────────── */}
        {(videosStatus === 'pending' || platformVideos.length > 0) && (
          <div className="mb-14">
            <div className="mb-5">
              <div
                className="text-[22px] text-[#eeeef0] mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                🔥 Hot Media Feed
              </div>
              {videosStatus !== 'pending' && (videoCount > 0 || photoCount > 0) && (
                <p className="text-[11px] text-[#4b5563] mt-[6px]">
                  {videoCount > 0 && <span>{videoCount} video{videoCount !== 1 ? 's' : ''}</span>}
                  {videoCount > 0 && photoCount > 0 && <span className="mx-[6px]">·</span>}
                  {photoCount > 0 && <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>}
                </p>
              )}
            </div>

            {videosStatus === 'pending' ? (
              <div className="flex gap-3 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)]"
                    style={{
                      aspectRatio: '4 / 5',
                      borderRadius: 14,
                      background: '#111620',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div
                ref={hotFeedRef}
                className="flex gap-3 overflow-x-auto pb-1"
                style={
                  {
                    scrollbarWidth: 'none',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                  } as React.CSSProperties
                }
                onMouseEnter={() => { hotFeedPaused.current = true }}
                onMouseLeave={() => { hotFeedPaused.current = false }}
              >
                {platformVideos.map((v) => (
                  <div
                    key={v.id}
                    className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)]"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <VideoCard video={v} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Section Divider Ad — below Hot Media Feed, above companion listings ── */}
        {sectionDividerBoost && <SectionDividerAd data={sectionDividerBoost} />}

        {/* Flex layout: main content left + optional sticky right rail on xl screens */}
        <div className="flex items-start">
          <div className="flex-1 min-w-0">
            {/* ── Promoted companions carousel (mobile/tablet < xl) ───────────────── */}
            {rightRailBoosts.length > 0 && (
              <div className="xl:hidden mb-10">
                {/* Heading */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div
                      className="text-[22px] text-[#eeeef0] mb-1"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Promoted<em style={{ fontStyle: 'italic', color: '#e8607a' }}> companions</em>
                    </div>
                    <p className="text-[11px] text-[#4b5563]">
                      {rightRailBoosts.length} featured this week
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#c9a96e',
                      background: 'rgba(201,169,110,0.08)',
                      border: '1px solid rgba(201,169,110,0.25)',
                      borderRadius: 6,
                      padding: '3px 9px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: 500,
                    }}
                  >
                    Advertisement
                  </span>
                </div>

                {/* Auto-sliding carousel */}
                <div
                  ref={railRef}
                  className="flex gap-4 overflow-x-auto pb-2"
                  style={
                    {
                      scrollSnapType: 'x mandatory',
                      scrollbarWidth: 'none',
                      WebkitOverflowScrolling: 'touch',
                    } as React.CSSProperties
                  }
                  onMouseEnter={() => { railPaused.current = true }}
                  onMouseLeave={() => { railPaused.current = false }}
                  onTouchStart={() => { railPaused.current = true }}
                  onTouchEnd={() => { railPaused.current = false }}
                >
                  {rightRailBoosts.map((boost) => (
                    <div
                      key={`mobile-rail-${boost.id}`}
                      style={{ width: 200, flexShrink: 0, scrollSnapAlign: 'start' }}
                    >
                      <RightRailAd data={boost} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── BLOCK 3: Companions who match your taste ─────────────────────────── */}
            <div className="mb-14">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div
                    className="text-[22px] text-[#eeeef0] mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Companions who match your taste
                  </div>
                  <p className="text-[12px] text-[#6b7280] max-w-[480px] leading-[1.5]">
                    Curated from profiles you hovered and content you enjoyed.
                  </p>
                </div>
                <Link
                  href="/companions"
                  className="text-[12.5px] text-[#e8607a] opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
                >
                  See all →
                </Link>
              </div>

              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="flex gap-4 overflow-x-auto pb-3"
                style={
                  {
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                  } as React.CSSProperties
                }
              >
                {companionsLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 220,
                        height: 280,
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                        borderRadius: 14,
                        background: '#111620',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  ))
                ) : (
                  <>
                    {featuredBoosts.map((boost) => (
                      <motion.div
                        key={`featured-${boost.id}`}
                        variants={cardItem}
                        style={{ scrollSnapAlign: 'start', flexShrink: 0, width: 198 }}
                      >
                        <FeaturedBoostCard data={boost} />
                      </motion.div>
                    ))}
                    {companionItems}
                  </>
                )}
              </motion.div>
            </div>

            {/* ── Mood Mix Panel — only shown when there's at least one real content item ── */}
            {(moodStory !== null || audioItems.length > 0) && (
            <div className="bg-[#111620] border border-[#1c2333] rounded-[20px] p-7 flex flex-col mb-14">
              <div
                className="text-[20px] text-[#eeeef0] mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Tonight&apos;s mood mix
              </div>
              <p className="text-[12px] text-[#6b7280] mb-[18px] leading-[1.5]">
                Based on your choices: <em>romantic, slow burn, private</em>
              </p>

              {/* Mood chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                  style={{
                    border: '1px solid rgba(232,96,122,0.3)',
                    background: 'rgba(232,96,122,0.08)',
                  }}
                >
                  Soft &amp; slow burn
                </span>
                <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                  Guided audio
                </span>
                <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                  Private confessions
                </span>
              </div>

              {/* Mood items */}
              <div className="flex flex-col gap-3">
                {moodStory && (
                  <MoodItem
                    type="Story"
                    title={moodStory.title}
                    meta={`${moodStory.duration} · ${moodStory.vibe}`}
                    onAction={() => router.push(`/stories/${moodStory.id}`)}
                    actionLabel="Read & listen"
                  />
                )}
                {audioItems.length > 0 && (
                  <MoodItem
                    type="Audio"
                    title={audioItems[0].title}
                    meta={`${audioItems[0].voice}${audioItems[0].duration ? ` · ${audioItems[0].duration}` : ''} · ${audioItems[0].vibe}`}
                    onAction={() =>
                      play({
                        id: audioItems[0].id,
                        title: audioItems[0].title,
                        meta: `${audioItems[0].voice} · ${audioItems[0].duration} · ${audioItems[0].vibe}`,
                      })
                    }
                    actionLabel="Preview"
                  />
                )}
                <MoodItem
                  type="Confessions"
                  title="Confessions like yours"
                  meta="Anonymous fantasies from similar profiles"
                  onAction={() => router.push('/stories')}
                  actionLabel="Open feed"
                />
              </div>
            </div>
            )}

            {/* ── BLOCK 4: Stories for your current mood — hidden when no data ─────── */}
            {(storiesLoading || hasAnyStories) && (
            <div className="mb-14">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div
                    className="text-[22px] text-[#eeeef0] mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Stories for your current mood
                  </div>
                  <p className="text-[12px] text-[#6b7280] max-w-[480px] leading-[1.5]">
                    Emotionally rich narratives tuned to your themes.
                  </p>
                </div>
                <Link
                  href="/stories"
                  className="text-[12.5px] text-[#e8607a] opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
                >
                  See all →
                </Link>
              </div>

              {/* Filter pills */}
              <div className="flex gap-2 flex-wrap mb-5">
                {(['All', 'Story', 'Confession'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className="text-[12px] px-[14px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
                    style={{
                      borderColor: activeFilter === f ? '#e8607a' : '#1c2333',
                      color: activeFilter === f ? '#e8607a' : '#6b7280',
                      background: activeFilter === f ? 'rgba(232,96,122,0.08)' : 'transparent',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {storiesLoading ? (
                <div
                  className="flex gap-4 overflow-x-auto pb-3"
                  style={{ scrollbarWidth: 'none' } as React.CSSProperties}
                >
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 240,
                        height: 220,
                        flexShrink: 0,
                        borderRadius: 14,
                        background: '#111620',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  key={activeFilter}
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="flex gap-4 overflow-x-auto pb-3"
                  style={
                    {
                      scrollSnapType: 'x mandatory',
                      scrollbarWidth: 'none',
                      WebkitOverflowScrolling: 'touch',
                    } as React.CSSProperties
                  }
                >
                  {filteredStories.map((s) => (
                    <motion.div
                      key={s.id}
                      variants={cardItem}
                      style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                    >
                      <StoryCard story={s} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
            )}

            {/* ── BLOCK 5: Audio for tonight — hidden when no approved audio in DB ── */}
            {audioItems.length > 0 && (
            <div className="mb-14">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div
                    className="text-[22px] text-[#eeeef0] mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Audio for tonight
                  </div>
                  <p className="text-[12px] text-[#6b7280] max-w-[480px] leading-[1.5]">
                    Voiced intimacy — warm, present, and entirely yours.
                  </p>
                </div>
                <Link
                  href="/audio"
                  className="text-[12.5px] text-[#e8607a] opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
                >
                  See all →
                </Link>
              </div>

              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="flex gap-4 overflow-x-auto pb-3"
                style={
                  {
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                  } as React.CSSProperties
                }
              >
                {audioItems.map((a) => (
                  <motion.div
                    key={a.id}
                    variants={cardItem}
                    style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                  >
                    <AudioCard audio={a} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
            )}

            {/* ── BLOCK 6: Confession → Companion bridge ───────────────────────────── */}
            {bridgeItems.length > 0 && (
              <div className="mb-14">
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <div
                      className="text-[22px] text-[#eeeef0] mb-1"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      From confession to companion
                    </div>
                    <p className="text-[12px] text-[#6b7280] max-w-[480px] leading-[1.5]">
                      Anonymous fantasies — and companions who can bring them to life.
                    </p>
                  </div>
                </div>

                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="flex gap-4 overflow-x-auto pb-3"
                  style={
                    {
                      scrollSnapType: 'x mandatory',
                      scrollbarWidth: 'none',
                      WebkitOverflowScrolling: 'touch',
                    } as React.CSSProperties
                  }
                >
                  {bridgeItems.map((entry, idx) => (
                    <motion.div
                      key={`${entry.kind}-${idx}`}
                      variants={cardItem}
                      style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                    >
                      {entry.kind === 'story' ? (
                        <StoryCard story={entry.item as StaticStory} />
                      ) : (
                        <div
                          className="rounded-[14px]"
                          style={{ border: '1px solid rgba(201,169,110,0.25)' }}
                        >
                          <CompanionCard companion={entry.item as Companion} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* ── Footer (commented out) ──────────────────────────────────────────── */}
            {/* <footer className="mt-24 pt-14 border-t border-[#1c2333]">

              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 pb-12">

                <div className="sm:col-span-2 lg:col-span-1">
                  <Image
                    src="/logo_light_croped.png"
                    alt="BlushBite"
                    width={130}
                    height={38}
                    className="mb-4"
                    style={{ objectFit: 'contain', objectPosition: 'left' }}
                  />
                  <p className="text-[13px] text-[#6b7280] leading-[1.75] mb-6 max-w-[230px]">
                    A private world of companionship.<br />
                    Verified, discreet, always on your terms.
                  </p>
                  <div className="flex gap-2">
                    <a href="https://instagram.com/blushbite" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-[#1c2333] text-[#6b7280] hover:text-[#e8607a] hover:bg-[rgba(232,96,122,0.08)] transition-all duration-150">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                      </svg>
                    </a>
                    <a href="https://x.com/blushbite" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-[#1c2333] text-[#6b7280] hover:text-[#e8607a] hover:bg-[rgba(232,96,122,0.08)] transition-all duration-150">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    <a href="https://t.me/blushbite" target="_blank" rel="noopener noreferrer" aria-label="Telegram"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-[#1c2333] text-[#6b7280] hover:text-[#e8607a] hover:bg-[rgba(232,96,122,0.08)] transition-all duration-150">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.08 13.918l-2.967-.924c-.645-.202-.658-.645.136-.953l11.57-4.461c.537-.194 1.006.131.075.64z"/>
                      </svg>
                    </a>
                    <a href="https://reddit.com/r/blushbite" target="_blank" rel="noopener noreferrer" aria-label="Reddit"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-[#1c2333] text-[#6b7280] hover:text-[#e8607a] hover:bg-[rgba(232,96,122,0.08)] transition-all duration-150">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                      </svg>
                    </a>
                  </div>
                </div>

                <div>
                  <h5 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4b5563] mb-5">Discover</h5>
                  <ul className="space-y-[10px]">
                    {[
                      { label: 'Browse Companions', href: '/companions' },
                      { label: 'Female Companions', href: '/female' },
                      { label: 'Male Companions', href: '/male' },
                      { label: 'TS Companions', href: '/shemale' },
                      { label: 'Stories', href: '/stories' },
                      { label: 'Confessions', href: '/confessions' },
                    ].map(({ label, href }) => (
                      <li key={href}>
                        <Link href={href} className="text-[13px] text-[#6b7280] hover:text-[#eeeef0] transition-colors duration-150">{label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4b5563] mb-5">Company</h5>
                  <ul className="space-y-[10px]">
                    <li><Link href="/advertise" className="text-[13px] text-[#6b7280] hover:text-[#eeeef0] transition-colors duration-150">Advertise with us</Link></li>
                    <li><a href="https://blushbite.live" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#6b7280] hover:text-[#eeeef0] transition-colors duration-150">Become a Companion</a></li>
                    <li><a href="mailto:hello@blushbite.co" className="text-[13px] text-[#6b7280] hover:text-[#eeeef0] transition-colors duration-150">Contact us</a></li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4b5563] mb-5">Legal &amp; Safety</h5>
                  <ul className="space-y-[10px]">
                    <li><Link href="/terms" className="text-[13px] text-[#6b7280] hover:text-[#eeeef0] transition-colors duration-150">Terms of Service</Link></li>
                    <li><Link href="/privacy" className="text-[13px] text-[#6b7280] hover:text-[#eeeef0] transition-colors duration-150">Privacy Policy</Link></li>
                    <li><Link href="/terms#content-policy" className="text-[13px] text-[#6b7280] hover:text-[#eeeef0] transition-colors duration-150">18+ Content Policy</Link></li>
                    <li><a href="mailto:abuse@blushbite.co" className="text-[13px] text-[#6b7280] hover:text-[#eeeef0] transition-colors duration-150">Report an issue</a></li>
                  </ul>
                </div>

              </div>

              <div className="border-t border-[#1c2333] pt-6 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-5 flex-wrap">
                  {['🔒 Anonymous IDs', '✦ Clear consent & boundaries', '🇪🇺 EU Hosted · GDPR', '💳 Transparent pricing'].map((badge) => (
                    <span key={badge} className="text-[12px] text-[#6b7280]">{badge}</span>
                  ))}
                </div>
                <p className="text-[11px] text-[#4b5563] whitespace-nowrap">© 2026 BlushBite · All rights reserved · 18+</p>
              </div>

            </footer> */}
          </div>
          {/* end main content column */}

          {/* ── Right rail ad placement (desktop ≥1280px) ─────────────────────── */}
          {rightRailBoosts.length > 0 && (
            <div
              className="hidden xl:flex flex-col flex-shrink-0 w-[200px] gap-3"
              style={{ position: 'sticky', top: 80, alignSelf: 'flex-start', marginLeft: 15 }}
            >
              {/* Advertisement label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 13,
                    color: '#eeeef0',
                  }}
                >
                  Promoted
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: '#c9a96e',
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.2)',
                    borderRadius: 4,
                    padding: '2px 6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Ad
                </span>
              </div>
              {rightRailBoosts.map((boost) => (
                <RightRailAd key={boost.id} data={boost} />
              ))}
            </div>
          )}
        </div>
        {/* end flex wrapper */}
      </motion.main>
    </>
  )
}

// ─── Mood item sub-component ─────────────────────────────────────────────────

function MoodItem({
  type,
  title,
  meta,
  onAction,
  actionLabel,
}: {
  type: string
  title: string
  meta: string
  onAction: () => void
  actionLabel: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="bg-[#161d2a] border rounded-[12px] px-4 py-[14px] flex items-center justify-between cursor-pointer transition-all duration-200"
      style={{
        borderColor: hovered ? 'rgba(232,96,122,0.4)' : '#1c2333',
        background: hovered ? 'rgba(232,96,122,0.05)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-[#e8607a] uppercase tracking-[0.08em] mb-[2px] font-medium">
          {type}
        </div>
        <div className="text-[13px] text-[#eeeef0] font-medium mb-[2px] truncate">{title}</div>
        <div className="text-[11px] text-[#6b7280]">{meta}</div>
      </div>
      <button
        className="text-[11px] text-[#e8607a] px-[10px] py-[5px] rounded-full flex-shrink-0 ml-3 border-none cursor-pointer transition-colors duration-150"
        style={{
          background: hovered ? 'rgba(232,96,122,0.2)' : 'rgba(232,96,122,0.1)',
          border: '1px solid rgba(232,96,122,0.2)',
        }}
        onClick={(e) => {
          e.stopPropagation()
          onAction()
        }}
      >
        {actionLabel}
      </button>
    </div>
  )
}
