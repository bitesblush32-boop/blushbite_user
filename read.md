
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