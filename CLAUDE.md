# BlushBite — Claude Code Master Context
# READ THIS ENTIRE FILE BEFORE WRITING ANY CODE

---

## 1. PROJECT IDENTITY & EMOTIONAL DESIGN BRIEF

BlushBite is a **premium adult companion & erotic fantasy platform**.
EU-hosted (Netherlands). Global audience. Strictly 18+.
Positioning: a "desire engine" — NOT an escort directory.
Core loop: user discovers companion through story or audio → reads/listens → books.
Every user is anonymous: alias only (@adjective-noun), real name never shown.

### The emotional contract — apply this to EVERY screen

The user is arriving somewhere private, intimate, slightly forbidden.
Think: walking into a dark, expensive, dimly-lit room where everyone
is beautiful and no one knows your name.

Every screen should make the user feel:
  private → dark backgrounds, no exposed real names, alias system
  desired → companions are presented as attentive, curated for YOU
  a little breathless → slow reveals, charged copy, rose glow, intimacy

This is NOT a SaaS product. It is NOT an escort directory.
The sign-in page is the door. The home feed is the room.
The companion profile is an introduction. The story is foreplay.
The booking is the decision. Design everything accordingly.

### Tone applied to every text element

Headlines (Playfair Display) — sound like the opening of an erotic story:
  GOOD: "An intimate evening with Ava" / "Your private world awaits" /
        "Tonight's desire" / "She remembers what you like"
  BAD:  "Book a companion" / "Browse profiles" / "Sign up" / "Get started"

Body copy — warm, suggestive, emotionally intelligent. Never crude. Never clinical:
  GOOD: "Curated entirely for you. Your taste is still forming."
  BAD:  "Select your preferences to receive personalized recommendations."

CTAs — personal, present tense, first person:
  GOOD: "Enter my world" / "View Ava's sessions" / "Read & listen" / "Choose my experience"
  BAD:  "Submit" / "Continue" / "View profile" / "Book now"

Labels — soft lowercase, intimate:
  GOOD: "tonight's mood mix" / "companions who match your taste" / "your private alias"
  BAD:  "Recommended" / "Your Profile" / "Settings"

Empty states — evocative, not empty:
  GOOD: "Nothing here yet. Your taste is still forming."
  BAD:  "No results found."

Error messages — never cold, never corporate:
  GOOD: "That email isn't with us yet — want to create an account?"
  BAD:  "Invalid credentials. Please try again."

Trust copy — reassuring without being defensive:
  GOOD: "Your identity stays private — always."
  BAD:  "We take your privacy seriously and comply with GDPR."

The platform is sex-positive and shame-free. Never apologetic about what it is.
Stories and confessions = literary erotica. Emotionally rich. Not pornographic.

---

## 2. PERFORMANCE MANDATE — 60FPS MINIMUM, NON-NEGOTIABLE

BlushBite targets a global audience: mid-range Android phones, older
iPhones, slow 4G connections. 60fps must be maintained at all times.

### Animation rules — GPU-composited only

```
ALWAYS animate these (GPU composited, zero layout cost):
  transform: translateX/Y/Z, scale, rotate
  opacity
  filter: blur() — sparingly, only on overlays

NEVER animate these (cause layout reflow, kill fps):
  width, height, top, left, right, bottom
  margin, padding, border-width
  background-color (use opacity transitions instead)
  font-size
```

### Framer Motion performance rules

```
- Use type:'tween' for UI transitions, type:'spring' for micro-interactions
- Page entrance: duration max 0.45s
- Card stagger: staggerChildren max 0.06 — no more
- Hover animations: duration max 0.2s
- Never use AnimatePresence on lists > 10 items (holds DOM nodes in memory)
- Never use layoutId unless doing a true shared-element transition
- Prefer CSS @keyframes for repeating effects (waveform bars, shimmer, pulse dots)
  CSS animations run on compositor thread — zero JS cost
```

### Scroll performance

```
- All horizontal scroll rows: add -webkit-overflow-scrolling: touch for
  momentum scrolling on iOS
- Never attach scroll event listeners on main thread — use IntersectionObserver
- Lists > 20 cards: use TanStack Virtual (TanStack Query already in stack)
- Scroll snap: scrollSnapType:'x mandatory' on scroll rows
```

### Component performance

```
- Wrap CompanionCard, StoryCard, AudioCard in React.memo() — they render
  in large lists and must not re-render on parent state changes
- Heavy modals (BookingModal, ProfileDrawer): next/dynamic with ssr:false
  so they are not in the initial bundle
- Named icon imports only: import { Heart } from 'lucide-react'
  NEVER: import * as Icons from 'lucide-react'
- Named framer imports: import { motion, AnimatePresence } from 'framer-motion'
```

### Image optimization

```
- All companion/story/audio placeholders: CSS gradients — zero network cost
- Logo: next/image with priority={true} on above-fold pages
- Any real photos (Phase 2+): WebP, Cloudflare CDN, proper sizes prop
- next/image: always set width + height + sizes, use placeholder="blur"
```

### will-change — use sparingly

```
ONLY on elements that animate constantly (not cards):
  Header (sticky/fixed): will-change: transform
  MiniPlayer (fixed): will-change: transform
  NEVER on cards, list items, page sections — creates too many GPU layers
```

### Target metrics

```
CLS (Cumulative Layout Shift): < 0.1
FID / INP: < 100ms
LCP: < 2.5s on 4G
Lighthouse Performance (mobile): > 85
No long tasks > 50ms on main thread
```

---

## 3. SCALABILITY PRINCIPLES

```
COMPONENT ARCHITECTURE:
  Every card type is a standalone React.memo component in components/ui/
  Never inline repeated card markup inside page files
  All data is props-driven — no hardcoded content inside components
  Phase 1: data from lib/data.ts   Phase 2+: data from TanStack Query hooks

STATE MANAGEMENT:
  Zustand stores: playerStore, moodStore, uiStore
  TanStack Query: all server state, caching, prefetching
  No prop drilling beyond 2 levels — use Zustand or context
  Never useState + useEffect for data fetching — always TanStack Query

ROUTING & CODE SPLITTING:
  Next.js App Router auto-splits each page into its own chunk
  Heavy modals: next/dynamic({ ssr: false }) — not in initial bundle
  Admin panel: next/dynamic — never loaded by regular users

API DESIGN (Phase 1 stubs → Phase 2 real Hono + tRPC):
  Response shape: always { data, error, meta }
  Always handle: 400 (validation), 401 (unauth), 403 (forbidden), 404, 500
  Rate limit all auth endpoints even in Phase 1

DATABASE (Phase 2):
  pgvector HNSW index on user preference embeddings for ML matching
  Redis: session blacklist, rate limit counters, BullMQ queues
  Never SELECT * — always select specific columns in Drizzle
  Indexes: users.email, users.alias, companions.city, stories.type
```

## 6. TECH STACK

### Frontend — apps/web

```
Next.js 14 App Router   TypeScript, file-based routing
Tailwind CSS v3         NOT v4 — postcss + autoprefixer
Framer Motion           all animations — GPU-composited only
Zustand                 client state (player, mood, ui stores)
TanStack Query v5       server state + caching
NextAuth v5 beta        3 providers: Google, Twitter/X, Credentials
React Hook Form + Zod   all forms
next/font               Playfair Display + DM Sans (never CDN @import)
lucide-react            named icon imports only
clsx + tailwind-merge   class utilities
bcryptjs                password hashing (cost factor 12)
@auth/drizzle-adapter   NextAuth + Drizzle ORM bridge
```

### Backend — Phase 1 = stubs in apps/web/app/api/

```
Hono.js v4 + tRPC v11   (scaffold in apps/api/, not wired Phase 1)
Drizzle ORM             PostgreSQL + pgvector
Redis + BullMQ          Phase 2+
ElevenLabs              AI audio (Phase 2)
OpenAI embeddings       pgvector matching (Phase 2)
```

### Install commands (inside apps/web)

```bash
pnpm add next-auth@beta @auth/drizzle-adapter
pnpm add framer-motion zustand @tanstack/react-query
pnpm add react-hook-form zod @hookform/resolvers
pnpm add bcryptjs lucide-react clsx tailwind-merge
pnpm add -D @types/bcryptjs tailwindcss@^3 postcss autoprefixer
```

### postcss.config.js — must be exactly this

```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

### globals.css — must start with these 3 lines (Tailwind v3)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### tailwind.config.ts content array

```ts
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
  './lib/**/*.{js,ts,jsx,tsx,mdx}',
  './store/**/*.{js,ts,jsx,tsx}',
]
```

---

## 7. DESIGN TOKENS (from social2.html :root — locked, do not change)

```
#07090f   --bg        page root — darkest navy-black
#0d1117   --bg2       modals, overlays, sheets
#111620   --card      card surface
#161d2a   --card2     nested card, inputs, hover states
#e8607a   --accent    rose-pink — ALL CTAs, active states
#c4485e   --accent2   accent on hover
#c9a96e   --gold      verified badges, premium
#eeeef0   --text      primary text
#6b7280   --muted     secondary text, labels, placeholders
#1c2333   --border    every border everywhere
rgba(232,96,122,0.18)  --glow
14px      --radius
8px       --radius-sm
```

### ALWAYS inline hex — never custom Tailwind names

```tsx
// CORRECT
className="bg-[#07090f] text-[#eeeef0] border border-[#1c2333]"
style={{ background: 'rgba(232,96,122,0.12)' }}

// WRONG — causes @apply errors in Tailwind v3
className="bg-card text-text border-border"
```

---

## 8. TYPOGRAPHY (from social2.html)

```
Display / Headings:  'Playfair Display', serif
                     Weights: 400, 600, italic 400
                     JSX: style={{ fontFamily: "'Playfair Display', serif" }}

Body / UI:           'DM Sans', sans-serif  (default — no need to specify)
                     Weights: 300, 400, 500

Sizes used (from social2.html):
  10px   overlines, badge labels, legal
  11px   chips, footnotes, trust items
  11.5px card meta, trust lines
  12px   section subtitles, filter labels, footer
  12.5px see-all links
  13px   body, nav links, secondary buttons
  13.5px primary buttons, card titles, modal about
  14px   base body
  14.5px story body reading text (color: #c4c8d0, line-height: 1.9)
  17px   session card name (Playfair)
  18px   session price
  20px   mood panel title (Playfair)
  22px   section titles (Playfair)
  28px   onboarding / story modal titles (Playfair)
  32px   hero h1 (Playfair)
  34px   companion modal name (Playfair)

Italic accent pattern (key Playfair headings):
  <h1 style={{ fontFamily:"'Playfair Display',serif" }}>
    Your private world{' '}
    <em style={{ fontStyle:'italic', color:'#e8607a' }}>awaits</em>
  </h1>
```

---

## 9. SPACING & DIMENSIONS (from social2.html)

```
Header height:        75px, fixed top-0, z-[900]
Mini player height:   68px, fixed bottom-0, z-[700]
Page padding:         px-10 (40px) desktop, px-5 (20px) mobile
Max content width:    max-w-[1400px] mx-auto
Hero grid:            grid-cols-[1fr_360px] gap-6
Hero companion card:  min-h-[360px], hero-img w-[260px], rounded-[20px]
Feed section gap:     mb-14 (56px)
Card row gap:         gap-4 (16px)
Companion card:       w-[220px], media h-[200px]
Story card:           w-[240px], media h-[130px]
Audio card:           w-[240px], media h-[100px]
Mood panel:           w-[360px], rounded-[20px], p-7
Modal max-width:      max-w-[860px], rounded-[20px]
Modal hero grid:      grid-cols-[300px_1fr], min-h-[360px]
Gallery grid:         grid-cols-4, gap-[10px], aspect-ratio 3/4
Sessions grid:        auto-fill minmax(220px, 1fr), gap-4
Directory grid:       auto-fill minmax(210px, 1fr), gap-[18px]
```

---

## 10. MUST-HAVE ON EVERY FULL-PAGE SCREEN

Both elements below must appear on every page. They are GPU-composited
(fixed + absolute positioning, pointer-events-none) — zero fps cost.

```tsx
{/* NOISE TEXTURE — always z-[1000], always fixed */}
<div
  className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
  style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }}
/>

{/* AMBIENT ROSE GLOW — absolute so it scrolls with content */}
<div
  className="absolute inset-0 pointer-events-none"
  style={{ background:'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)' }}
/>
```

---

## 11. COMPONENT PATTERNS (exact from social2.html)

### Header (fixed, 75px, glassmorphism)
```tsx
<header className="fixed top-0 left-0 right-0 z-[900] flex items-center justify-between px-10 h-[75px] border-b border-[#1c2333]"
  style={{ background:'rgba(7,9,15,0.82)', backdropFilter:'blur(20px)', willChange:'transform' }}>
```

### Nav Link
```tsx
// inactive
<button className="text-[#6b7280] text-[13.5px] px-[14px] py-[6px] rounded-[20px] bg-transparent border-none cursor-pointer transition-all duration-200 hover:text-[#eeeef0] hover:bg-white/[0.06]">
// active: style={{ color:'#eeeef0', background:'rgba(232,96,122,0.14)' }}
```

### User Pill (header right)
```tsx
<div className="flex items-center gap-2 bg-[#111620] border border-[#1c2333] py-[6px] pl-2 pr-[14px] rounded-[24px] cursor-pointer transition-colors hover:border-[#e8607a] relative">
  <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
    style={{ background:'linear-gradient(135deg,#e8607a,#9b5fe0)' }}>MW</div>
  <span className="text-[12px] text-[#6b7280]">@midnight-wanderer</span>
  <span className="text-[12px] text-[#6b7280] ml-1">▾</span>
</div>
```

### Primary Button
```tsx
<button className="bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-[22px] py-[12px] rounded-[10px] text-[13.5px] font-medium cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(232,96,122,0.3)]">
```

### Secondary Button
```tsx
<button className="bg-transparent text-[#6b7280] border border-[#1c2333] px-[20px] py-[10px] rounded-[10px] text-[13px] cursor-pointer transition-all duration-200 hover:border-white/20 hover:text-[#eeeef0]">
```

### Chip — Default
```tsx
<span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
```

### Chip — Rose
```tsx
<span className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
  style={{ border:'1px solid rgba(232,96,122,0.3)', background:'rgba(232,96,122,0.08)' }}>
```

### Chip — Gold
```tsx
<span className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
  style={{ border:'1px solid rgba(201,169,110,0.35)', background:'rgba(201,169,110,0.08)' }}>
```

### Hero Featured Chip
```tsx
<div className="inline-flex items-center gap-[6px] text-[11px] font-medium text-[#e8607a] px-[10px] py-1 rounded-full w-fit mb-[14px] tracking-[0.04em]"
  style={{ background:'rgba(232,96,122,0.12)', border:'1px solid rgba(232,96,122,0.25)' }}>
  <span className="w-[6px] h-[6px] rounded-full bg-current inline-block"/>
  For you · Verified companion
</div>
```

### Verified Badge
```tsx
<span className="inline-flex items-center gap-[5px] text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
  style={{ background:'rgba(201,169,110,0.15)', border:'1px solid rgba(201,169,110,0.35)' }}>
  ✦ Verified & Licensed
</span>
```

### Filter Pill (active state via state variable)
```tsx
<button className="text-[12px] px-[14px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
  style={{
    borderColor: active ? '#e8607a' : '#1c2333',
    color: active ? '#e8607a' : '#6b7280',
    background: active ? 'rgba(232,96,122,0.08)' : 'transparent',
  }}>
```

### Section Header
```tsx
<div className="flex items-end justify-between mb-5">
  <div>
    <div style={{ fontFamily:"'Playfair Display',serif" }} className="text-[22px] text-[#eeeef0] mb-1">Title</div>
    <p className="text-[12px] text-[#6b7280] max-w-[480px] leading-[1.5]">Subtitle.</p>
  </div>
  <a className="text-[12.5px] text-[#e8607a] cursor-pointer opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap">See all →</a>
</div>
```

### Scroll Row (horizontal, snap, touch-momentum)
```tsx
<div className="flex gap-4 overflow-x-auto pb-3"
  style={{ scrollSnapType:'x mandatory', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
  {/* each child: style={{ scrollSnapAlign:'start', flexShrink:0 }} */}
</div>
```

### Companion Card (220px) — always React.memo in components/ui/CompanionCard.tsx
```tsx
<div className="w-[220px] bg-[#111620] border border-[#1c2333] rounded-[14px] overflow-hidden cursor-pointer relative group transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(232,96,122,0.2)]">
  <div className="h-[200px] relative overflow-hidden" style={{ background:companion.gradient }}>
    <div className="absolute inset-0 flex items-center justify-center">
      <svg width="70" height="140" viewBox="0 0 70 140" fill="rgba(255,255,255,0.12)">
        <ellipse cx="35" cy="22" rx="16" ry="18"/>
        <path d="M12 68 Q18 45 35 43 Q52 45 58 68 L60 130 Q50 138 35 140 Q20 138 10 130Z"/>
      </svg>
    </div>
    <div className="absolute inset-0" style={{ background:'linear-gradient(transparent 50%,rgba(17,22,32,0.95) 100%)' }}/>
    <div className="absolute top-[10px] left-[10px] text-[10px] text-[#eeeef0] px-2 py-[3px] rounded-full border border-white/[0.08] tracking-[0.04em]"
      style={{ background:'rgba(7,9,15,0.75)', backdropFilter:'blur(6px)' }}>Verified · {companion.city}</div>
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white text-sm"
        style={{ background:'rgba(232,96,122,0.85)' }}>▶</div>
    </div>
  </div>
  <div className="p-[14px]">
    <div className="text-[14px] font-medium text-[#eeeef0] mb-1">
      {companion.name} · <span className="text-[#6b7280] font-normal text-[11.5px]">{companion.vibe}</span>
    </div>
    <div className="text-[11.5px] text-[#6b7280] mb-[10px]">{companion.city} · {companion.price}/evening</div>
    <div className="flex flex-wrap gap-[6px]">
      {companion.tags.map(t=><span key={t} className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">{t}</span>)}
    </div>
  </div>
</div>
```

### Story Card (240px) — always React.memo in components/ui/StoryCard.tsx
```tsx
<div className="w-[240px] bg-[#111620] border border-[#1c2333] rounded-[14px] overflow-hidden cursor-pointer transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
  <div className="h-[130px] relative overflow-hidden" style={{ background:story.gradient }}>
    <div className="absolute bottom-[10px] left-[10px] flex gap-[6px]">
      <span className="text-[10px] text-[#eeeef0] px-2 py-[3px] rounded-full border border-white/[0.08]"
        style={{ background:'rgba(7,9,15,0.75)', backdropFilter:'blur(6px)' }}>{story.type}</span>
      <span className="text-[10px] text-[#6b7280] px-2 py-[3px] rounded-full border border-white/[0.08]"
        style={{ background:'rgba(7,9,15,0.75)', backdropFilter:'blur(6px)' }}>{story.duration}</span>
    </div>
  </div>
  <div className="p-[14px]">
    <div className="text-[14px] font-medium text-[#eeeef0] mb-[6px] leading-[1.3]">{story.title}</div>
    <div className="text-[11.5px] text-[#6b7280] mb-[10px] leading-[1.5]">{story.vibe}</div>
    <div className="flex flex-wrap gap-[6px]">
      {story.tags.map(t=><span key={t} className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">{t}</span>)}
    </div>
  </div>
</div>
```

### Audio Card (240px, CSS waveform) — always React.memo in components/ui/AudioCard.tsx
```tsx
// globals.css must have: @keyframes wave { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
// CSS animation — runs on compositor thread, zero JS cost
<div className="w-[240px] bg-[#111620] border border-[#1c2333] rounded-[14px] overflow-hidden cursor-pointer relative group transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
  <div className="h-[100px] flex items-center justify-center relative overflow-hidden" style={{ background:audio.gradient }}>
    <div className="flex items-center gap-[3px] h-[40px] px-5">
      {Array.from({length:18}).map((_,i)=>(
        <div key={i} style={{ width:3,borderRadius:2,background:'#e8607a',opacity:0.6,
          height:`${14+(i%5)*6}px`,animation:`wave 1.2s ease-in-out ${(i*0.07).toFixed(2)}s infinite` }}/>
      ))}
    </div>
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white"
        style={{ background:'#e8607a', boxShadow:'0 0 24px rgba(232,96,122,0.5)' }}>▶</div>
    </div>
  </div>
  <div className="p-[14px]">
    <div className="text-[14px] font-medium text-[#eeeef0] mb-[4px]">{audio.title}</div>
    <div className="text-[11.5px] text-[#6b7280] mb-[10px]">{audio.voice} · {audio.duration} · {audio.vibe}</div>
    <div className="flex flex-wrap gap-[6px]">
      {audio.tags.map(t=><span key={t} className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">{t}</span>)}
    </div>
  </div>
</div>
```

### Mood Panel (360px, hero right column)
```tsx
<div className="bg-[#111620] border border-[#1c2333] rounded-[20px] p-7 flex flex-col w-[360px]">
  <div style={{ fontFamily:"'Playfair Display',serif" }} className="text-[20px] text-[#eeeef0] mb-1">Tonight's mood mix</div>
  <p className="text-[12px] text-[#6b7280] mb-[18px] leading-[1.5]">Curated from your preferences.</p>
  <div className="flex flex-wrap gap-2 mb-6">{/* mood chips */}</div>
  <div className="flex flex-col gap-3 flex-1">{/* 3 mood items */}</div>
</div>
```

### Mood Item
```tsx
<div className="bg-[#161d2a] border border-[#1c2333] rounded-[12px] px-4 py-[14px] flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-[rgba(232,96,122,0.4)] hover:bg-[rgba(232,96,122,0.05)]">
  <div className="flex-1">
    <div className="text-[10px] text-[#e8607a] uppercase tracking-[0.08em] mb-[2px] font-medium">Story</div>
    <div className="text-[13px] text-[#eeeef0] font-medium mb-[2px]">The hotel bar piano</div>
    <div className="text-[11px] text-[#6b7280]">8 min · Slow burn</div>
  </div>
  <button className="text-[11px] text-[#e8607a] px-[10px] py-[5px] rounded-full flex-shrink-0 ml-3"
    style={{ background:'rgba(232,96,122,0.1)', border:'1px solid rgba(232,96,122,0.2)' }}>
    Read & listen
  </button>
</div>
```

### Mood Slider Bar (below header on home)
```tsx
<div className="flex items-center gap-[14px] bg-[#111620] border border-[#1c2333] rounded-[40px] py-[10px] px-5 mb-8">
  <span className="text-[12px] text-[#6b7280]">Tonight I want:</span>
  <span className="text-[11px] text-[#eeeef0]">Softer</span>
  <input type="range" min={0} max={100} defaultValue={50} className="flex-1 cursor-pointer" style={{ accentColor:'#e8607a' }}/>
  <span className="text-[11px] text-[#eeeef0]">Spicier</span>
</div>
```

### Mini Audio Player (fixed bottom-0, 68px)
```tsx
<div className="fixed bottom-0 left-0 right-0 h-[68px] border-t border-[#1c2333] z-[700] flex items-center px-10 gap-5"
  style={{ background:'rgba(13,17,23,0.95)', backdropFilter:'blur(20px)', willChange:'transform' }}>
  {/* Left: prev + play-pause rose circle 42px + next */}
  {/* Middle: flex-1, title 13px text-[#eeeef0] + meta 11px text-[#6b7280] */}
  {/* Right: scrubber flex-1 max-w-[320px] h-[4px] bg-[#1c2333] rose fill + close btn */}
</div>
```

### Modal (companion profile, booking, story)
```tsx
<div className="fixed inset-0 bg-black/80 backdrop-blur-[8px] z-[800] flex items-start justify-center px-5 py-20 overflow-y-auto">
  <motion.div initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }}
    transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
    className="bg-[#0d1117] border border-[#1c2333] rounded-[20px] w-full max-w-[860px] overflow-hidden relative">
    {/* Close: absolute top-4 right-4, 36px circle, bg-white/7, hover:bg rose/15, × icon */}
  </motion.div>
</div>
```

### Session Card
```tsx
<div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5 transition-colors cursor-pointer hover:border-[rgba(232,96,122,0.4)]">
  <div style={{ fontFamily:"'Playfair Display',serif" }} className="text-[17px] text-[#eeeef0] mb-2">Session Name</div>
  <p className="text-[12.5px] text-[#6b7280] leading-[1.6] mb-[14px]">Short description of the session.</p>
  <div className="text-[18px] text-[#e8607a] font-medium mb-3">€280</div>
  <div className="flex gap-2 flex-wrap">
    {/* duration pills: border #1c2333 muted; active: rose border+tint */}
  </div>
</div>
```

### Trust Line
```tsx
<div className="flex gap-4 mt-4 flex-wrap">
  <span className="flex items-center gap-[6px] text-[11.5px] text-[#6b7280]">
    <span className="text-[#c9a96e]">🔒</span>Anonymous booking
  </span>
  <span className="flex items-center gap-[6px] text-[11.5px] text-[#6b7280]">
    <span className="text-[#c9a96e]">✦</span>Verified & licensed
  </span>
</div>
```

### Top Accent Line (auth cards, modals)
```tsx
<div className="h-[2px]" style={{ background:'linear-gradient(90deg,transparent,#e8607a,transparent)' }}/>
```

---

## 12. PLACEHOLDER GRADIENTS (NEVER gray — always these)

```
Companion media:
  comp-1: linear-gradient(135deg,#1a1228,#2a1535,#1a2240)
  comp-2: linear-gradient(135deg,#0f1a28,#1f2840,#2a1020)
  comp-3: linear-gradient(135deg,#201228,#1a2030,#2a1a18)
  comp-4: linear-gradient(135deg,#0a1620,#1a1535,#201a10)
  comp-5: linear-gradient(135deg,#1a1020,#2a1530,#101820)
  comp-6: linear-gradient(135deg,#101820,#201028,#102020)

Story media:
  story-1: linear-gradient(135deg,#1a0e20,#2a1540)
  story-2: linear-gradient(135deg,#0e1a18,#101f30)
  story-3: linear-gradient(135deg,#1a1010,#2a1520)
  story-4: linear-gradient(135deg,#0f1428,#1a1040)

Audio media:
  audio-1: linear-gradient(135deg,#16101e,#2a1040)
  audio-2: linear-gradient(135deg,#101622,#201030)
  audio-3: linear-gradient(135deg,#0e1820,#1a1230)

Explore themes:
  Romantic:     linear-gradient(135deg,#2a0a1a,#1a0a2a)
  Intense:      linear-gradient(135deg,#0a1a2a,#1a0a20)
  Voyeur:       linear-gradient(135deg,#1a1a0a,#2a1020)
  Roleplay:     linear-gradient(135deg,#0a1a20,#200a2a)
  Experimental: linear-gradient(135deg,#1a0a0a,#2a1a30)
  Gentle:       linear-gradient(135deg,#0f1a10,#1a102a)

Avatar: linear-gradient(135deg,#e8607a,#9b5fe0)
```

---

## 13. FRAMER MOTION (required on every screen, GPU-composited only)

```tsx
// Page entrance — every page root wrapper
<motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
  transition={{ duration:0.45, ease:[0.22,1,0.36,1] }}>

// Card stagger — wrap scroll rows
const container = { hidden:{}, show:{ transition:{ staggerChildren:0.06 } } }
const cardItem = { hidden:{ opacity:0,y:16 }, show:{ opacity:1,y:0,
  transition:{ duration:0.4, ease:[0.22,1,0.36,1] } } }
// parent: variants={container} initial="hidden" animate="show"
// each card: variants={cardItem}

// Modal entrance
initial={{ opacity:0,scale:0.95,y:20 }} animate={{ opacity:1,scale:1,y:0 }}
transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}

// Wizard step (AnimatePresence mode="wait")
initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }}
exit={{ opacity:0,x:-20 }} transition={{ duration:0.3 }}

// Badge / checkmark pop-in
initial={{ scale:0 }} animate={{ scale:1 }} transition={{ duration:0.15 }}

// Mini player slide up
initial={{ y:68 }} animate={{ y:0 }}
transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}
```

---

## 14. AUTH SYSTEM

### Three providers

```
Google OAuth      — primary, most users
Twitter/X OAuth   — secondary, sign in with X account
Credentials       — email + password (like OnlyFans: email not username)
                    toggle between Sign in / Register on same form
                    password hashed with bcrypt cost factor 12
```

### Two-file auth split (required for Edge runtime)

```
auth.config.ts   — edge-safe: NO bcrypt, NO db imports
                   used by middleware.ts
                   contains: pages, session strategy, jwt/session callbacks

auth.ts          — full Node.js: bcrypt, DrizzleAdapter, all providers
                   contains: Google, Twitter, Credentials providers
                   exports: handlers, auth, signIn, signOut
```

### Middleware flow (3-gate)

```
No session                          → redirect /auth/signin
Session + age_verified=false        → redirect /auth/age-gate
Session + onboarding_complete=false → redirect /auth/onboarding
All pass                            → through

Public routes (skip all guards):
  /auth/signin  /auth/age-gate  /auth/error  /api/auth/*  /api/auth/register
```

### JWT custom fields

```typescript
token.id                  string   user DB id
token.role                string   'user' | 'companion' | 'admin'
token.alias               string   "@adjective-noun"
token.age_verified        boolean  false until /auth/age-gate
token.onboarding_complete boolean  false until onboarding step 3
```

### .env.local variables

```bash
# Generate: openssl rand -base64 32
AUTH_SECRET=

# console.cloud.google.com → Credentials → OAuth 2.0
# Redirect URI: http://localhost:3000/api/auth/callback/google
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# developer.twitter.com → App → Keys and Tokens → OAuth 2.0
# App type: Web App (confidential). Redirect URI: http://localhost:3000/api/auth/callback/twitter
AUTH_TWITTER_ID=
AUTH_TWITTER_SECRET=

# PostgreSQL — Railway in prod, local for dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blushbite
```

### Database schema (Drizzle ORM — packages/db/src/schema.ts)

```typescript
// Required NextAuth tables: users, accounts, sessions, verificationTokens
// Custom columns added to users table:

users:
  id                 text primaryKey (crypto.randomUUID())
  name               text nullable
  email              text unique notNull
  emailVerified      timestamp nullable
  image              text nullable
  username           text unique nullable      ← display name (not login)
  hashedPassword     text nullable             ← null for OAuth-only users
  role               enum('user','companion','admin') default 'user'
  alias              text nullable             ← @adjective-noun, auto-generated
  age_verified       boolean default false
  onboarding_complete boolean default false
  created_at         timestamp defaultNow()
  updated_at         timestamp defaultNow()

accounts:
  userId, type, provider, providerAccountId (composite PK)
  refresh_token, access_token, expires_at, token_type, scope, id_token, session_state

sessions:
  sessionToken (PK), userId (FK → users.id), expires

verificationTokens:
  identifier, token, expires (composite PK)
```

### types/next-auth.d.ts

```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'user' | 'companion' | 'admin'
      alias: string
      age_verified: boolean
      onboarding_complete: boolean
    } & DefaultSession['user']
  }
}
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    alias: string
    age_verified: boolean
    onboarding_complete: boolean
  }
}
```

---

## 15. ZUSTAND STORES (store/ folder)

### playerStore.ts

```typescript
interface PlayerStore {
  visible: boolean
  playing: boolean
  title: string
  meta: string        // "voice · duration · vibe"
  progress: number    // 0-100
  audioId: string | null
  play: (audio: { id:string, title:string, meta:string }) => void
  pause: () => void
  resume: () => void
  close: () => void
  setProgress: (p: number) => void
}
```

### moodStore.ts

```typescript
interface MoodStore {
  intensity: number   // 0-100, default 50
  setIntensity: (v: number) => void
}
```

### uiStore.ts

```typescript
interface UIStore {
  drawerOpen: boolean
  modalOpen: boolean
  modalCompanionId: string | null
  openDrawer: () => void
  closeDrawer: () => void
  openModal: (companionId: string) => void
  closeModal: () => void
}
```

---

## 16. DUMMY DATA (lib/data.ts — use in ALL screens)

```typescript
export const companions = [
  { id:'1', name:'Ava',   age:26, city:'Amsterdam', price:'€280', vibe:'Romantic & in control',  tags:['Romantic','Light roleplay','First-timer'],    gradient:'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)' },
  { id:'2', name:'Nora',  age:29, city:'Amsterdam', price:'€320', vibe:'Gentle but decisive',     tags:['Soft dominance','Confessions','Intimate'],     gradient:'linear-gradient(135deg,#0f1a28,#1f2840,#2a1020)' },
  { id:'3', name:'Seren', age:31, city:'Paris',     price:'€350', vibe:'Intellectual & intense',  tags:['Intense','Roleplay','Experimental'],           gradient:'linear-gradient(135deg,#201228,#1a2030,#2a1a18)' },
  { id:'4', name:'Kai',   age:27, city:'London',    price:'€260', vibe:'Warm & unhurried',        tags:['Gentle','Romantic','Sensory focus'],           gradient:'linear-gradient(135deg,#0a1620,#1a1535,#201a10)' },
  { id:'5', name:'Maëve', age:30, city:'Paris',     price:'€400', vibe:'Mysterious & precise',    tags:['Power dynamic','Experimental','Luxury'],      gradient:'linear-gradient(135deg,#1a1020,#2a1530,#101820)' },
  { id:'6', name:'Irina', age:25, city:'Amsterdam', price:'€290', vibe:'Playful & confident',     tags:['Roleplay','Light touch','Fun'],                gradient:'linear-gradient(135deg,#101820,#201028,#102020)' },
  { id:'7', name:'Sol',   age:28, city:'London',    price:'€310', vibe:'Calm & attentive',        tags:['Sensory focus','Gentle','Slow burn'],          gradient:'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)' },
  { id:'8', name:'Alara', age:33, city:'Paris',     price:'€380', vibe:'Bold & expressive',       tags:['Intense','Dominant energy','Confident'],      gradient:'linear-gradient(135deg,#201228,#1a2030,#2a1a18)' },
]

export const stories = [
  { id:'1', title:'The hotel bar piano',       type:'Story',      duration:'8 min',  vibe:'Gentle tension & slow build', tags:['Slow burn','Romantic'],         handle:'@still-figuring-it-out', gradient:'linear-gradient(135deg,#1a0e20,#2a1540)' },
  { id:'2', title:'Tuesday afternoon',         type:'Confession', duration:'5 min',  vibe:'Unexpected intimacy',         tags:['Confessions','Slice of life'],  handle:'@not-what-youd-think',   gradient:'linear-gradient(135deg,#0e1a18,#101f30)' },
  { id:'3', title:'The last train north',      type:'Story',      duration:'11 min', vibe:'Charged quiet & slow reveal', tags:['Intense','Slow burn','Romantic'],handle:'@northern-lights-27',    gradient:'linear-gradient(135deg,#1a1010,#2a1520)' },
  { id:'4', title:'First night confession',    type:'Confession', duration:'6 min',  vibe:'Tender vulnerability',        tags:['Confessions','First-timer'],    handle:'@january-light',         gradient:'linear-gradient(135deg,#0f1428,#1a1040)' },
  { id:'5', title:'Slow afternoon, Barcelona', type:'Story',      duration:'9 min',  vibe:'Sensory & present',           tags:['Sensory focus','Romantic'],     handle:'@harbour-fog',           gradient:'linear-gradient(135deg,#1a0e20,#2a1540)' },
  { id:'6', title:'The question she asked',    type:'Confession', duration:'4 min',  vibe:'Quiet revelation',            tags:['Confessions','Intense'],        handle:'@quiet-room',            gradient:'linear-gradient(135deg,#0e1a18,#101f30)' },
]

export const audios = [
  { id:'1', title:'Husky goodnight',  voice:'Femme · Husky', duration:'12 min', vibe:'Warm & intimate',    tags:['Soft guidance','Popular'], gradient:'linear-gradient(135deg,#16101e,#2a1040)' },
  { id:'2', title:'The long commute', voice:'Masc · Calm',   duration:'8 min',  vibe:'Gentle & attentive', tags:['Slow build','Relaxing'],   gradient:'linear-gradient(135deg,#101622,#201030)' },
  { id:'3', title:'Late shift',       voice:'Neutral',        duration:'10 min', vibe:'Steady presence',    tags:['Neutral','Grounding'],     gradient:'linear-gradient(135deg,#0e1820,#1a1230)' },
  { id:'4', title:'Unnamed wanting',  voice:'Femme · Soft',   duration:'15 min', vibe:'Slow confession',    tags:['Confessions','Intimate'],  gradient:'linear-gradient(135deg,#16101e,#2a1040)' },
  { id:'5', title:'Rain on windows',  voice:'Masc · Low',     duration:'6 min',  vibe:'Present & still',    tags:['Sensory','Relaxing'],      gradient:'linear-gradient(135deg,#101622,#201030)' },
  { id:'6', title:'Tuesday at three', voice:'Neutral',        duration:'9 min',  vibe:'Honest & close',     tags:['Confessions'],             gradient:'linear-gradient(135deg,#0e1820,#1a1230)' },
]
```

---

## 17. DATABASE SCHEMA — READ BEFORE WRITING ANY DB CODE

### Connection
```
Provider:  Railway PostgreSQL (EU Frankfurt)
Drizzle config: apps/web/drizzle.config.ts
Schema file:    apps/web/db/schema.ts
```

### CRITICAL RULE — always check before creating
```
BEFORE writing any API route, server action, or Drizzle query:
  1. Check the table list below — does the table you need already exist?
  2. If YES → use it. Never duplicate or recreate existing tables.
  3. If NO → ask before creating. State: "Table X does not exist in Phase 1
             schema — should I create it or use [existing table] instead?"
  4. Never SELECT * — always select specific columns.
  5. Always use the exact column names below — no guessing.
```

### Architecture — two completely separate entities
```
DREAMERS  → live in: users, user_accounts, user_profiles, user_fantasy_tags
COMPANIONS → live in: companions, companion_accounts, companion_profiles, companion_*

NO cross-FK between the two sides EXCEPT:
  booking_requests           (user_id → users, companion_profile_id → companion_profiles)
  fantasy_tag_overlap_scores (user_id → users, companion_profile_id → companion_profiles)
```

### All 35 Phase 1 Tables

#### DREAMER SIDE
```
users
  id, email, email_verified, hashed_password, name, image,
  alias, onboarding_complete, created_at, updated_at

user_accounts
  id, user_id→users, provider, provider_account_id, type,
  refresh_token, access_token, expires_at, token_type, scope, id_token, session_state

user_profiles
  id, user_id→users(UNIQUE), gender, desired_genders(jsonb),
  vibes(jsonb), mood_intensity, created_at, updated_at

user_fantasy_tags
  user_id→users (PK), fantasy_tag_id→fantasy_tags (PK), intensity
```

#### COMPANION SIDE
```
companions
  id, email, email_verified, hashed_password, name, image, alias,
  onboarding_complete, full_name, date_of_birth, country,
  companion_stage, created_at, updated_at

companion_accounts
  id, companion_id→companions, provider, provider_account_id, type,
  refresh_token, access_token, expires_at, token_type, scope, id_token, session_state

companion_profiles
  id, companion_id→companions(UNIQUE), bio, tagline, city, hourly_rate,
  currency, availability_status, is_verified, verified_at,
  is_live, approved_at, created_at, updated_at

companion_photos
  id, companion_profile_id→companion_profiles, url, storage_key,
  alt_text, sort_order, is_primary, is_approved, deleted_at, created_at

companion_videos
  id, companion_profile_id→companion_profiles, url, storage_key,
  duration_seconds(max 15), thumbnail_url, is_approved, deleted_at, created_at

companion_languages  [junction]
  companion_profile_id→companion_profiles (PK), language_id→languages (PK), fluency

companion_vibe_tags  [junction]
  companion_profile_id→companion_profiles (PK), vibe_tag_id→vibe_tags (PK)

companion_fantasy_tags  [junction]
  companion_profile_id→companion_profiles (PK), fantasy_tag_id→fantasy_tags (PK)

session_cards
  id, companion_profile_id→companion_profiles, title, description,
  duration_minutes, price, currency, session_type, is_active,
  sort_order, deleted_at, created_at, updated_at

companion_onboarding_progress
  id, companion_id→companions, stage(1-7), status, completed_at, notes
  UNIQUE: (companion_id, stage)

companion_verifications
  id, companion_id→companions(UNIQUE), id_document_front_url, id_document_back_url,
  selfie_url, liveness_check_passed, provider, provider_reference_id,
  provider_status, provider_response(jsonb), verified_at, expires_at,
  created_at, updated_at

companion_legal_docs
  id, companion_id→companions, document_type(tos|model_release|form_2257),
  signed_at, ip_address, document_version, signature_data, pdf_url, created_at
  UNIQUE: (companion_id, document_type)

companion_payment_setup
  id, companion_id→companions(UNIQUE), bank_country, bank_account_last4,
  bank_account_verified, tax_form_type, tax_form_url, tax_form_submitted,
  created_at, updated_at
```

#### SHARED LOOKUPS (read-only in most API routes — seeded at migration)
```
languages           id(serial), code(UNIQUE), name
fantasy_categories  id(serial), name(UNIQUE), slug(UNIQUE), description, sort_order, is_active
fantasy_tags        id(serial), category_id→fantasy_categories, name, slug(UNIQUE), description, is_active
vibe_tags           id(serial), name(UNIQUE), slug(UNIQUE), emoji, is_active
mood_tags           id(serial), name(UNIQUE), slug(UNIQUE), emoji, is_active
orientation_tags    id(serial), name(UNIQUE), slug(UNIQUE), is_active
story_categories    id(serial), name(UNIQUE), slug(UNIQUE), description, sort_order, is_active
```

#### CONTENT
```
stories
  id, author_type(admin|companion|user), author_user_id→users(nullable),
  author_companion_id→companions(nullable), category_id→story_categories,
  title, body, excerpt, is_anonymous, is_published, is_featured,
  moderation_status(pending|approved|rejected), moderated_at,
  view_count, like_count, save_count, comment_count,
  published_at, deleted_at, created_at, updated_at

story_mood_tags         [junction] story_id→stories (PK), mood_tag_id→mood_tags (PK)
story_orientation_tags  [junction] story_id→stories (PK), orientation_tag_id→orientation_tags (PK)
story_fantasy_tags      [junction] story_id→stories (PK), fantasy_tag_id→fantasy_tags (PK)

audio_recordings
  id, author_type(companion|user), author_user_id→users(nullable),
  author_companion_id→companions(nullable),
  companion_profile_id→companion_profiles(nullable), story_id→stories(nullable),
  title, description, url, storage_key, duration_seconds, file_size_bytes,
  mime_type, is_original_voice, is_anonymous,
  moderation_status(pending|approved|rejected),
  listen_count, like_count, save_count, deleted_at, created_at, updated_at
```

#### ENGAGEMENT (dreamers only — user_id always → users)
```
likes
  id, user_id→users, content_type(story|audio_recording|comment|companion_profile),
  content_id(uuid), created_at
  UNIQUE: (user_id, content_type, content_id)

saves
  id, user_id→users, content_type(story|audio_recording|companion_profile|session_card),
  content_id(uuid), created_at
  UNIQUE: (user_id, content_type, content_id)

comments
  id, user_id→users, content_type(story|audio_recording), content_id(uuid),
  parent_id→comments(nullable, 1-level only), body, is_anonymous,
  moderation_status(pending|approved|rejected), like_count,
  deleted_at, created_at, updated_at
```

#### BOOKING + BRIDGE (intentional cross-side tables)
```
booking_requests
  id, user_id→users, companion_profile_id→companion_profiles,
  session_card_id→session_cards(nullable),
  status(pending|accepted|declined|cancelled|completed),
  requested_date, requested_time, requested_duration_minutes,
  message, companion_notes, price_quoted, currency, created_at, updated_at

fantasy_tag_overlap_scores
  id, user_id→users, companion_profile_id→companion_profiles,
  overlap_score(decimal 0-1), matching_tag_count, total_user_tags,
  total_companion_tags, computed_at
  UNIQUE: (user_id, companion_profile_id)
```

### Drizzle query rules
```typescript
// ALWAYS import from the correct schema path
import { users, companions, stories } from '@/db/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'

// ALWAYS filter soft-deleted rows
.where(and(eq(stories.isPublished, true), isNull(stories.deletedAt)))

// NEVER SELECT * — always name columns
db.select({ id: stories.id, title: stories.title }).from(stories)

// Author type pattern for stories
// user-authored:      author_type='user',      author_user_id=user.id, author_companion_id=null
// companion-authored: author_type='companion',  author_companion_id=companion.id, author_user_id=null
// admin-seeded:       author_type='admin',      both null
```

---

## 18. CODE RULES

```
1. 'use client'      — only for hooks/events/browser APIs. Prefer server components.
2. Colors            — inline hex ONLY. text-[#6b7280] NEVER text-muted.
3. Gradients/shadows — style={{ }} always. Never Tailwind custom names.
4. Framer Motion     — every page: entrance + stagger + hover micro-interactions.
5. Performance       — animate only transform/opacity. See section 2.
6. React.memo        — CompanionCard, StoryCard, AudioCard always memo-wrapped.
7. No gray boxes     — gradient fills from section 12 only.
8. Loading states    — every async button: disabled + spinner state.
9. Phase 1 APIs      — apps/web/app/api/ only, stub data + TODO DB comment.
10. Forms            — React Hook Form + Zod. Never native submit.
11. Images           — next/image for logo only. CSS gradients for all media.
12. Mobile           — every layout works at 375px.
13. Hover            — every card: hover:-translate-y-1 + shadow + rose border glow.
14. Icons            — named imports only: import { Heart } from 'lucide-react'
15. Dynamic imports  — BookingModal, ProfileDrawer: next/dynamic({ ssr:false })
16. Output           — create files only. Never explain code back.
```

---

## 18. BUILD CHECKLIST

### One-time setup
- [ ] pnpm-workspace.yaml at BlushBite/ root
- [ ] pnpm create next-app@latest apps/web (TypeScript, Tailwind, App Router, no src)
- [ ] Install dependencies (section 6)
- [ ] Fix postcss.config.js (section 6)
- [ ] Copy design_system/tailwind.config.ts → apps/web/tailwind.config.ts (fix content array)
- [ ] Copy design_system/globals.css → apps/web/app/globals.css (ensure @tailwind at top)
- [ ] Add @keyframes wave to globals.css
- [ ] Copy demo_designs/logo_light.png → apps/web/public/logo_light.png
- [ ] apps/web/lib/fonts.ts (Playfair + DM Sans via next/font)
- [ ] apps/web/app/layout.tsx
- [ ] apps/web/lib/data.ts
- [ ] apps/web/lib/alias.ts
- [ ] apps/web/store/playerStore.ts
- [ ] apps/web/store/moodStore.ts
- [ ] apps/web/store/uiStore.ts
- [ ] packages/db/src/schema.ts
- [ ] packages/db/src/index.ts
- [ ] apps/web/types/next-auth.d.ts
- [ ] apps/web/auth.config.ts (edge-safe)
- [ ] apps/web/auth.ts (full, all 3 providers)
- [ ] apps/web/app/api/auth/[...nextauth]/route.ts
- [ ] apps/web/app/api/auth/register/route.ts
- [ ] apps/web/middleware.ts
- [ ] apps/web/.env.local (with placeholder values + comments)

### Screens
- [ ] /auth/signin (Google + Twitter + Credentials with register toggle)
- [ ] /auth/age-gate
- [ ] /auth/onboarding (3 steps)
- [ ] / home feed
- [ ] /companions
- [ ] /companions/[id]
- [ ] /stories
- [ ] /stories/[id]
- [ ] /audio
- [ ] /explore
- [ ] /admin

### Shared components
- [ ] components/layout/Header.tsx
- [ ] components/layout/MiniPlayer.tsx
- [ ] components/ui/CompanionCard.tsx (React.memo)
- [ ] components/ui/StoryCard.tsx (React.memo)
- [ ] components/ui/AudioCard.tsx (React.memo)
- [ ] components/ui/BookingModal.tsx (next/dynamic)
- [ ] components/ui/ProfileDrawer.tsx (next/dynamic)

---

## 19. CURRENT FILE STRUCTURE (as-built — updated 2026-04-05)

```
BlushBite/                                  ← monorepo root
├── .dockerignore
├── .gitattributes
├── .gitignore
├── .npmrc                                  ← shamefully-hoist=true
├── Dockerfile                              ← multi-stage node:20-alpine build
├── nixpacks.toml                           ← nixPkgs = ["nodejs_20"]
├── pnpm-lock.yaml
├── pnpm-workspace.yaml                     ← packages: ['apps/*']
├── railway.json                            ← builder: DOCKERFILE
│
├── apps/
│   └── web/                               ← Next.js 14 App Router
│       ├── .env.local
│       ├── auth.config.ts                 ← edge-safe, no bcrypt/db
│       ├── auth.ts                        ← full Node.js, all 3 providers
│       ├── drizzle.config.ts
│       ├── middleware.ts                  ← 3-gate auth middleware
│       ├── next.config.js
│       ├── next-env.d.ts
│       ├── package.json                   ← name: blushbite-web
│       ├── postcss.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       │
│       ├── app/                           ← Next.js App Router root
│       │   ├── globals.css                ← Tailwind base + design tokens + body.feed-mode + body.canvas-mode
│       │   ├── layout.tsx                 ← root layout, fonts, providers
│       │   ├── providers.tsx              ← QueryClientProvider + SessionProvider
│       │   │
│       │   ├── (auth)/                    ← auth route group
│       │   │   ├── layout.tsx
│       │   │   └── auth/
│       │   │       ├── signin/page.tsx    ← Google + Credentials, register toggle
│       │   │       └── onboarding/page.tsx
│       │   │
│       │   ├── (dreamer)/                 ← main app route group
│       │   │   ├── layout.tsx             ← Header + BottomNav + MiniPlayer + pt-[95px]
│       │   │   ├── page.tsx               ← home feed
│       │   │   ├── confessions/page.tsx   ← full-screen reel (feed-mode, no padding)
│       │   │   ├── create/page.tsx        ← composer: canvas → meta → preview/publish
│       │   │   └── profile/page.tsx
│       │   │
│       │   ├── (companion)/               ← companion onboarding route group
│       │   │   ├── layout.tsx
│       │   │   └── companion/onboarding/
│       │   │       ├── identity/page.tsx
│       │   │       └── verify/page.tsx    ← Didit liveness check
│       │   │
│       │   ├── privacy/page.tsx
│       │   ├── terms/page.tsx
│       │   │
│       │   └── api/
│       │       ├── auth/
│       │       │   ├── [...nextauth]/route.ts
│       │       │   ├── register/route.ts
│       │       │   └── complete-onboarding/route.ts
│       │       ├── companions/onboarding/
│       │       │   ├── identity/route.ts
│       │       │   └── verify/
│       │       │       ├── start/route.ts
│       │       │       └── status/route.ts
│       │       ├── confessions/route.ts   ← GET paginated feed
│       │       ├── stories/
│       │       │   ├── route.ts           ← POST create story
│       │       │   ├── views/route.ts     ← POST bulk view tracking
│       │       │   └── [id]/
│       │       │       ├── comments/route.ts
│       │       │       ├── like/route.ts   ← POST like / DELETE unlike
│       │       │       └── save/route.ts
│       │       ├── tags/route.ts
│       │       ├── users/
│       │       │   ├── profile/route.ts
│       │       │   ├── avatar/route.ts
│       │       │   ├── photos/route.ts
│       │       │   └── posts/
│       │       │       ├── route.ts
│       │       │       └── [id]/route.ts
│       │       ├── upload/
│       │       │   ├── file/route.ts      ← PUT direct upload → R2
│       │       │   └── presigned-url/route.ts
│       │       ├── webhooks/didit/route.ts
│       │       ├── health/route.ts
│       │       └── dev/reset-test-user/route.ts
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.tsx             ← fixed 75px, .bb-header, glassmorphism
│       │   │   ├── BottomNav.tsx          ← .bb-bottom-nav, hidden in feed-mode
│       │   │   └── MiniPlayer.tsx         ← fixed bottom-0 68px, playerStore
│       │   └── ui/
│       │       ├── ActionPill.tsx         ← like/comment/save/mute, useLikeMutation
│       │       ├── AudioCard.tsx          ← React.memo, 240px, CSS waveform
│       │       ├── BookingModal.tsx       ← next/dynamic ssr:false
│       │       ├── CommentsSheet.tsx      ← vaul drawer, uiStore.activeStoryId
│       │       ├── CompanionCard.tsx      ← React.memo, 220px
│       │       ├── ConfessionCard.tsx     ← memo, double-tap → useLikeMutation
│       │       ├── ConfessionsFeed.tsx    ← fixed inset-0, snap-y, body.feed-mode
│       │       ├── DiditVerify.tsx        ← Didit liveness SDK wrapper
│       │       ├── EditProfileDrawer.tsx
│       │       ├── FileUpload.tsx         ← useUploadToR2
│       │       ├── ProfileDrawer.tsx      ← next/dynamic ssr:false
│       │       ├── StoryCard.tsx          ← React.memo, 240px
│       │       ├── StoryMeta.tsx          ← author + tags, bottom:48, no excerpt
│       │       ├── StoryPageContent.tsx   ← swipe pages, dots bottom-center
│       │       └── TasteDrawer.tsx
│       │
│       ├── db/
│       │   ├── index.ts                   ← Drizzle + postgres connection
│       │   ├── schema.ts                  ← all 35 Phase 1 tables
│       │   └── migrations/
│       │       └── add_profile_fields.sql
│       │
│       ├── hooks/
│       │   ├── useInfiniteConfessions.ts  ← TanStack Query infinite scroll, ['confessions','feed']
│       │   ├── useLikeMutation.ts         ← optimistic update on ['confessions','feed'] cache
│       │   ├── useSaveMutation.ts
│       │   ├── useUploadToR2.ts
│       │   └── useViewTracking.ts         ← IntersectionObserver + batch queue
│       │
│       ├── lib/
│       │   ├── alias.ts                   ← @adjective-noun generator
│       │   ├── data.ts                    ← dummy companions/stories/audios
│       │   ├── fonts.ts                   ← next/font: Playfair Display + DM Sans
│       │   ├── paginateText.ts            ← split body into 700-char pages
│       │   ├── r2.ts                      ← Cloudflare R2 S3 client
│       │   ├── types.ts
│       │   └── viewTrackingQueue.ts       ← batched view event queue
│       │
│       ├── public/
│       │   ├── bb.png
│       │   └── logo_light.png
│       │
│       ├── store/
│       │   ├── moodStore.ts               ← intensity 0-100
│       │   ├── playerStore.ts             ← audio player state
│       │   └── uiStore.ts                 ← drawer/modal/comments/mute state
│       │
│       └── types/
│           └── next-auth.d.ts             ← Session + JWT augmentation
│
├── demo_designs/                          ← reference HTML + logo assets
│   ├── social2.html                       ← master design reference
│   ├── logo_light.png
│   └── logos/                             ← a.png … logo_dark.png
│
├── design_system/                         ← locked design tokens reference
│   ├── design-system.html
│   ├── globals.css
│   └── tailwind.config.ts
│
└── documentation/                         ← PDFs: PRD, agreements, tech stack
    ├── BlushBite_Development_Agreement.pdf
    ├── BlushBite_Master_PRD.pdf
    ├── BlushBite_PRD.pdf
    ├── BlushBite_Proposal.pdf
    ├── BlushBite_TechStack_v2.pdf
    ├── Signed_BlushBite-MSDS_Agreement_Updated.pdf
    └── Signed_Document_20260319_123843.pdf
```

### Key path aliases (apps/web/tsconfig.json)
```
@/*  →  apps/web/* (root of the web app)

Examples:
  @/components/ui/ConfessionCard   →  apps/web/components/ui/ConfessionCard.tsx
  @/hooks/useLikeMutation          →  apps/web/hooks/useLikeMutation.ts
  @/store/uiStore                  →  apps/web/store/uiStore.ts
  @/db/schema                      →  apps/web/db/schema.ts
  @/lib/data                       →  apps/web/lib/data.ts
```

### Route → file map
```
/                          →  app/(dreamer)/page.tsx
/confessions               →  app/(dreamer)/confessions/page.tsx
/create                    →  app/(dreamer)/create/page.tsx
/profile                   →  app/(dreamer)/profile/page.tsx
/auth/signin               →  app/(auth)/auth/signin/page.tsx
/auth/onboarding           →  app/(auth)/auth/onboarding/page.tsx
/companion/onboarding/…    →  app/(companion)/companion/onboarding/…/page.tsx
/privacy                   →  app/privacy/page.tsx
/terms                     →  app/terms/page.tsx
```