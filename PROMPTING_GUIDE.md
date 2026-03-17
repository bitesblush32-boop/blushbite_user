# BlushBite — Claude Code Prompting Guide

## How Claude Code reads context
Claude Code automatically reads CLAUDE.md at session start.
You never need to re-explain the design system, colors, or project.
Just say: "Read @CLAUDE.md" at the start of any session.
Reference files with @path/to/file — Claude reads them in full.

---

## Master Prompt Template

Use this skeleton for EVERY screen:

```
Read @CLAUDE.md.
[Reference existing screen if matching style: Match style of @apps/web/app/auth/signin/page.tsx]

Build: [exact file path]

SCREEN: [name]
PURPOSE: [1 sentence — what does this screen do]
ROUTE: [where it lives, where it goes after]

DATA NEEDED:
- [list what state/props/fetches this screen needs]

COMPONENTS TO BUILD:
- [component 1 + exact behavior]
- [component 2 + exact behavior]

API ROUTES NEEDED:
- [method] [path] → [what it returns — stub for now]

DESIGN RULES:
- Noise overlay + rose ambient glow (always)
- [any screen-specific layout rules]
- [any screen-specific component notes]

CONTENT:
- [exact copy for headlines, labels, CTAs]
- Use dummy data from CLAUDE.md (companions/stories/audio arrays)

DO NOT add features beyond this list.
Create the file(s). Do not explain them back to me.
```

---

## Session Start (run this every time you open Claude Code)

```
Read @CLAUDE.md. We're building BlushBite Phase 1.
Check the ✅ Done and 🔨 Building Next lists.
Today we're building: [screen name].
```

---

## Screen-by-Screen Prompt Library

### HOME FEED (/)

```
Read @CLAUDE.md.

Build: apps/web/app/page.tsx
Also build: apps/web/components/layout/Header.tsx
Also build: apps/web/components/layout/MiniPlayer.tsx

SCREEN: Home Feed
PURPOSE: Personalised content feed — the main destination after onboarding
ROUTE: / (protected, requires age_verified + onboarding_complete)

LAYOUT:
- Full page, bg #07090f, noise + glow
- Fixed header (75px) at top — see Header spec below
- Mood slider bar sticky below header
- Main content: padding-top for header, max-w-[1400px] mx-auto px-10
- 5 horizontal scroll sections in order
- Mini player fixed to bottom (hidden until audio plays)

HEADER COMPONENT (apps/web/components/layout/Header.tsx):
- bg rgba(7,9,15,0.82) backdrop-blur-[20px] border-b border-[#1c2333] fixed top-0 z-50
- Left: logo /logo_light.png width=120 height=70 object-contain
- Center: nav links — Home, Stories, Audio, Companions, Explore
  Each is a Next.js Link, styled as nav-link, active state rose tinted pill
- Right: user pill — avatar (gradient circle initials), @alias from session, chevron
  Hover shows dropdown: Profile & Preferences, Safety & Privacy, Sign out (red)
- Mobile: hide nav, keep logo + user pill + hamburger icon

MOOD SLIDER BAR:
- Below header, full width, max-w-[1400px] mx-auto
- bg #111620 border border-[#1c2333] rounded-full py-[10px] px-5
- "Tonight I want:" label | "Softer" | range input accent #e8607a | "Spicier"
- Zustand moodStore: moodIntensity (0-100)

5 FEED SECTIONS (each is a horizontal scroll row, gap-4, snap scroll, hide scrollbar):
Each section has: section title (Playfair 22px) + subtitle (12px muted) + "See all →" link

Section 1 — "Companions who match your taste"
- 6 companion cards from dummy data
- See all → /companions

Section 2 — "Stories for your current mood"
- All 6 stories as story cards
- See all → /stories

Section 3 — "Voices you might like tonight"
- All 6 audio cards (with animated waveform bars)
- See all → /audio

Section 4 — "Confessions from people like you"
- Alternate: confession card → companion bridge card → confession card → companion bridge card
- Bridge card has gold chip "From similar confessions"

Section 5 — "Trending near Amsterdam"
- 6 companion cards (reversed order from section 1)
- See all → /companions

HERO (above the 5 sections, below mood slider):
- 2-column grid: featured companion card (left) + mood panel (right)
- Featured companion: large card, companion gradient bg, silhouette SVG
  Hero chip: "For you · Verified companion" rose pill with dot
  Playfair 32px headline: "An intimate evening with Ava" (Ava in italic)
  Subtitle, meta chips (rose + default + gold), 2 buttons
  Trust line: 🔒 Anonymous booking · ✦ Verified & licensed
- Mood panel (right, 360px): "Tonight's mood mix" 
  3 mood items (Story + Audio + Confessions) each with type label + title + meta + rose button
  Items from stories[0], audios[0], stories type Confession

COMPANION CARD component:
- 220px wide, bg #111620, border #1c2333, rounded-[14px]
- Media area 200px: gradient bg + silhouette SVG centered + card-media-tag top-left + play overlay on hover
- Body: card title (name · vibe in muted), meta (city · price), chip tags
- Hover: -translate-y-1 + shadow + rose border glow

STORY CARD component:
- 240px wide, media 130px gradient, type+duration pill bottom-left, body with title+meta+tags
- Hover: -translate-y-1 shadow

AUDIO CARD component:
- 240px wide, media 100px gradient, animated waveform bars (18 bars, staggered animation-delay)
- Play overlay on hover (rose circle)
- Body: title, voice+duration+vibe, tags

MINI PLAYER (apps/web/components/layout/MiniPlayer.tsx):
- Fixed bottom-0, full width, height 68px
- bg rgba(13,17,23,0.95) backdrop-blur-[20px] border-t border-[#1c2333]
- Left: prev/play-pause/next buttons (play-pause is rose circle)
- Middle: title + meta text
- Right: scrubber bar (4px, rose fill, clickable) + close button
- Zustand playerStore: { title, meta, playing, progress, visible }
- Hidden when not visible. Slides up with slideFromBottom animation when shown.

API ROUTE: GET /api/feed → returns { companions, stories, audios } arrays from CLAUDE.md dummy data

Framer Motion: cards stagger in with staggerChildren 0.06 per section.
Mobile: single column sections stack, hero becomes single column.

Create all files. Do not explain.
```

---

### COMPANION DIRECTORY (/companions)

```
Read @CLAUDE.md. Match header/layout from @apps/web/app/page.tsx

Build: apps/web/app/companions/page.tsx

SCREEN: Companion Directory
PURPOSE: Browse and filter all companions
ROUTE: /companions

LAYOUT:
- Same header + noise + glow as home
- Page title "Companion Directory" (Playfair 28px) + subtitle
- Filter bar: Location (All / Amsterdam / Paris / London) + Vibe (Romantic / Intense / Experimental) + Sort (Recommended / Price ↑ / Newest)
  bg #111620 border rounded-[14px] p-5, filter pills with active state
- Directory grid: responsive, auto-fill minmax(210px, 1fr), gap-[18px]
- 8 companion cards from dummy data
- Each card: same CompanionCard component from home feed
- Clicking a card → /companions/[id]

STATE: activeFilters (location, vibe, sort) in useState
FILTER LOGIC: client-side filter on dummy data array

API ROUTE: GET /api/companions → returns companions array

No other features. Create file.
```

---

### COMPANION PROFILE (/companions/[id])

```
Read @CLAUDE.md. Match card/chip styles from @apps/web/app/companions/page.tsx

Build: apps/web/app/companions/[id]/page.tsx

SCREEN: Companion Profile
PURPOSE: Full profile — photos, bio, sessions, booking CTA
ROUTE: /companions/[id]

LAYOUT:
- Same header + noise + glow
- Hero section: 2-column grid (300px photo left | info right)
  Photo area: companion gradient + silhouette SVG + verified badge bottom-left
  Info: name (Playfair 34px), age + city, descriptor chips, about paragraph (3 lines erotic-literary tone), do/don't lists
  CTA: "Choose an experience & book" (primary full-width) + "Message first" (secondary)
  Trust line: 🔒 identity private · ✦ transparent pricing
  
- Gallery grid: 4 columns, 3:4 aspect ratio items, each is gradient fill + label on hover
  4 items per companion: "Arriving — hotel lobby", "Lingerie set", "Evening wear", "Candid — terrace"

- Sessions & Pricing section (below gallery):
  3 session cards in responsive grid
  Each: session name (Playfair 17px), desc (muted), price (rose 18px), duration pills
  Sessions: "Slow, intimate evening", "Social companion", "Weekend retreat"
  Duration pills: click to select (rose active state)

- Story Bridge section (bottom):
  "Stories written about experiences like this" 
  Horizontal scroll of 2-3 story cards filtered by matching tags
  
COMPANION DATA: use dummy data by id param
SESSION DATA: hardcoded 3 sessions per companion

API ROUTE: GET /api/companions/[id] → returns single companion object + sessions array

Booking CTA opens a modal (build the modal too):
  BookingModal: companion name, selected session, selected duration, name field, 
  email field (note: kept private), message textarea (optional), 
  "Request booking" button → POST /api/bookings → { success: true } stub
  Confirmation state: success message + trust reassurance

Create all files.
```

---

### STORIES PAGE (/stories)

```
Read @CLAUDE.md. Match layout from @apps/web/app/companions/page.tsx

Build: apps/web/app/stories/page.tsx
Build: apps/web/app/stories/[id]/page.tsx

SCREEN 1: Stories Index
- Filter pills: All / Stories / Confessions / Romantic / Intense / Slow burn / Experimental
- Grid: auto-fill minmax(240px, 1fr), all 6 story cards
- Each card clickable → /stories/[id]

SCREEN 2: Story Detail (/stories/[id])
LAYOUT:
- Header as usual
- Story header section: overline (type · duration), Playfair 28px title, tag chips + handle chip
  Two buttons: "Read" (primary) + "▶ Listen in AI voice" (secondary, triggers mini player)
- Story body: max reading width 680px, 14.5px, line-height 1.9, color #c4c8d0
  Paragraphs with generous spacing (erotic literary short fiction content)
  Generate 4-5 paragraphs of tasteful erotic literary fiction appropriate to each story's vibe
- Story-to-Escort Bridge section (bottom, separated by border):
  "Want to experience something like this?" italic muted label
  Horizontal scroll of 3 companion cards matched by tag overlap (static)

API ROUTE: GET /api/stories → array, GET /api/stories/[id] → single story with full text

Create all files.
```

---

### AUDIO PAGE (/audio)

```
Read @CLAUDE.md. Match layout from @apps/web/app/stories/page.tsx

Build: apps/web/app/audio/page.tsx

SCREEN: Audio Experiences
- Subtitle: "AI voices reading real fantasies and confessions."
- Filter pills: All voices / Husky femme / Calm masc / Neutral / Soft guidance
- Grid: auto-fill minmax(240px, 1fr), all 6 audio cards
- Each card: clicking plays in MiniPlayer (update Zustand playerStore)
  title = audio.title, meta = "voice · duration · vibe"
- Waveform bars animate on hover (CSS animation)

No other features. Create file.
```

---

### EXPLORE PAGE (/explore)

```
Read @CLAUDE.md. Match header from @apps/web/app/page.tsx

Build: apps/web/app/explore/page.tsx

SCREEN: Explore
- 6 theme cards in responsive grid (auto-fill minmax(200px, 1fr)):
  Romantic 🌹, Intense ⚡, Voyeur 🌙, Roleplay 🎭, Experimental 🔬, Gentle 🕊️
  Each: unique gradient bg, emoji, Playfair name, muted desc, hover -translate-y-1
  
- "Trending themes this week" section:
  Flex wrap of oversized chips: "Slow burn ↑ 24%" (rose), "First-timer friendly" (gold), 
  "Power dynamic", "Sensory focus", "Hotel scenarios", "Confessions"

- "Tonight's Mix Builder" (simple version):
  Mood slider (same as home) + 3 theme pills to select → "Build my feed" button
  Button → navigates to / with filter params (Phase 1: just navigates home)

No other features. Create file.
```

---

### USER PROFILE DRAWER

```
Read @CLAUDE.md. Match chip/button styles from existing screens.

Build: apps/web/components/ui/ProfileDrawer.tsx
(Slide-in drawer from right, triggered from header user pill)

SECTIONS:
1. Alias display + "Change alias" link (greyed if changed < 30 days ago)
2. Your Preferences: gender, interest, themes (chips, all editable, same UI as onboarding)
3. Mood Intensity: same slider as onboarding step 3
4. Privacy & Safety: 3 toggle switches (bg #161d2a style)
   - Anonymous browsing mode
   - Hide my activity from companions
   - Email notifications
5. Account: Sign out button (rose text, no bg), Delete account (muted, destructive)

DRAWER STYLE:
- Fixed right-0 top-0 bottom-0, w-[380px], bg #0d1117, border-l border-[#1c2333]
- Overlay: bg black/60 backdrop-blur-sm covering rest of screen
- Framer Motion: slides in from x: 380 → x: 0
- Close X button top-right

API ROUTE: PATCH /api/user/preferences → accepts { gender, interest, themes, moodIntensity } → stub

Create file.
```

---

### ADMIN PANEL (/admin)

```
Read @CLAUDE.md.

Build: apps/web/app/admin/page.tsx
Build: apps/web/middleware.ts (update to add role='admin' check for /admin routes)

SCREEN: Admin Panel v1
ACCESS: role === 'admin' only, else redirect to /

LAYOUT: sidebar (240px) + main content area
Sidebar: logo, nav items (Dashboard, Companions, Stories, Bookings, Users)
bg #0d1117, border-r border-[#1c2333]

DASHBOARD TAB (default):
- 4 stat cards: Total Companions, Active Bookings, Stories Published, Users This Week
  Each: bg #111620 border rounded-[14px] p-6, big number (Playfair 36px rose), label below
- Recent bookings table: date, user alias, companion, session type, status chip (Pending/Confirmed/Completed)
  Table: bg #111620 border rounded-[14px], header row muted, rows with bottom border

COMPANIONS TAB:
- Table of all companions: name, city, price, tags, status (Active/Pending/Suspended)
- Each row: "View" link + "Suspend" button
- "Add companion" button (top right) → opens modal with companion form fields

No other features. Create files.
```

---

## Prompting Rules for Minimal Token Usage

### DO
- Start every session: `Read @CLAUDE.md`
- Reference previous screens: `Match style of @apps/web/app/auth/signin/page.tsx`
- Be explicit about file paths: `Build: apps/web/app/companions/page.tsx`
- List exact components and behaviors
- End with: `Create the file(s). Do not explain.`

### DON'T
- Never describe colors — reference the design system
- Never describe the noise overlay — it's in CLAUDE.md, just say "noise + glow as standard"
- Never ask for explanation after — say "do not explain it back to me"
- Never mix multiple unrelated screens in one prompt
- Never say "make it look good" — be specific

### For bug fixes
```
In @apps/web/app/[file]:
[exact error message or behavior]
Fix only this. Do not change any other code.
```

### For consistency checks
```
Read @apps/web/app/auth/signin/page.tsx and @apps/web/app/companions/page.tsx
Make [new screen] visually consistent with both.
Specifically match: [button style / card style / spacing].
```

### For adding a feature to existing screen
```
In @apps/web/app/companions/page.tsx:
Add: [exact feature]
Do not change any existing code except what's needed.
```