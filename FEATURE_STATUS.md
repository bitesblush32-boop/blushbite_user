# blushbite.co — Feature Status

Ground truth for what's built vs. stubbed. `CLAUDE.md` §17/§19/§21 is stale (43 tables not 35,
more routes than listed) — trust this file over those sections.

**Tags:** `incomplete` · `built` (real, untested) · `built+tested` (human confirmed in UI) ·
`bug` · `major-flaw` (works via a workaround that will break in prod)

**Upkeep:** update the matching row before ending any session that touches a route/table. Only
a human sets `built+tested`. Seeded 2026-07-26 from a full-repo audit.

---

## Major Flaws

None on the blushbite.co side. (See `landingpagebb-/FEATURE_STATUS.md` for OTP storage and
middleware-duplication flaws in the companion portal.)

---

## Stories

| Sub-feature | Status | Evidence | Notes |
|---|---|---|---|
| Read / feed | `built` | `app/api/platform-stories/route.ts`, `hooks/useInfiniteStories.ts` | |
| Like | `incomplete` | `app/api/stories/[id]/like/route.ts` — 401 stub | |
| Save | `incomplete` | `app/api/stories/[id]/save/route.ts` — 401 stub | |
| Comment | `incomplete` | `app/api/stories/[id]/comments/route.ts` — 401 stub | |
| Create/edit/delete | `incomplete` | `app/api/stories/route.ts` — 401 stub | Companion-side story CRUD is separate (see Companion Self-Service) |
| Companion-story bridge | `unknown — needs check` | `app/api/stories/[id]/bridges/route.ts`, table `companion_story_bridges` | Not spot-checked |
| View tracking | `built` | `app/api/stories/views/route.ts`, `lib/viewTrackingQueue.ts` | |
| Admin moderation | `built` | `app/api/admin/content/*`, `app/api/admin/stories/*` | approve/reject/feature |

## Notifications

One shared send path (`db/helpers/createNotification.ts`) handles every type — not split by
category in code. It maps legacy types down onto a narrower DB enum inconsistently: `story_like`
and `comment_like` both collapse to `profile_viewed`; `story_comment` and `comment_reply` both
collapse to `booking_request` — flagged as `bug` below since it can leak unrelated notifications
into a filtered view.

| Sub-feature | Status | Evidence | Notes |
|---|---|---|---|
| story_like | `bug` | `db/helpers/createNotification.ts` | Collapses to DB enum `profile_viewed` |
| story_save | `bug` | same file | Also `profile_viewed` |
| story_comment | `bug` | same file | Collapses to DB enum `booking_request` |
| comment_reply | `bug` | same file | Also `booking_request` |
| comment_like | `bug` | same file | Also `profile_viewed` |
| List / count / mark-read (API) | `incomplete` | `app/api/notifications/*` — all 401 stubs | Send-side works, read-side doesn't — can't function end-to-end |
| booking_request/confirmed/declined/reminder | `unknown — needs check` | DB enum exists, no confirmed caller in this repo | landingpagebb- fires confirmed/declined into the same shared table |
| profile_viewed/story_linked/admin_approved/verification_complete/bridge_approved/badge_awarded | `unknown — needs check` | admin routes insert some of these as a side effect of approvals | No dedicated notification-management route |
| payment_received/payout_processed/boost_purchased/new_device_login/password_changed | `incomplete` | DB enum exists, no caller found | Likely Phase 2 |
| Push subscribe/unsubscribe | `incomplete` | `app/api/push/subscribe`, `unsubscribe` — stubs | |
| Push send | `built` | `lib/sendPushNotification.ts`, called from `createNotification()` | Nothing to send to until subscribe is wired |

## Companion Self-Service

| Sub-feature | Status | Evidence | Notes |
|---|---|---|---|
| Onboarding submit/discover/feed | `built` | `app/api/companions/{onboarding/submit,discover,feed}`, send-otp/verify-otp | |
| Profile edit | `incomplete` | `app/api/companions/profile`, `profile/full` — stubs | |
| Apply | `incomplete` | `app/api/companions/apply` — stub | |
| Nearby | `incomplete` | `app/api/companions/nearby` — stub | |
| Analytics summary | `incomplete` | `app/api/companions/analytics/summary` — stub | |
| Bookings management | `incomplete` | `app/api/companions/bookings/[id]` — stub | |
| Media upload | `incomplete` | `app/api/companions/media/{photo,video}` — stubs | |
| Onboarding sub-steps | `incomplete` | `app/api/companions/onboarding/{identity,legal,profile,submit/status,verify/*}` — stubs | |
| Settings / deactivate / password | `incomplete` | `app/api/companions/settings*` — stubs | |
| Booking bridge | `incomplete` | `app/api/companion/bridge/*` (6 endpoints) — stubs | |
| Legal doc signing | `incomplete` | `app/api/companion/legal/sign` — stub | |

## Bookings

| Sub-feature | Status | Evidence | Notes |
|---|---|---|---|
| Dreamer: create request | `built` | `app/api/bookings/route.ts` | |
| Companion: accept/decline | `incomplete` | `app/api/companions/bookings/[id]` — stub | |
| Admin: oversight/list | `built` | `app/api/admin/bookings/route.ts` | |

## Profile

| Sub-feature | Status | Evidence | Notes |
|---|---|---|---|
| Dreamer profile settings | `incomplete` | `app/api/users/{avatar,liked,photos,posts,saved/confessions}` — stubs | `app/api/users/profile/route.ts` is real (106 lines) — inconsistent with the rest |
| Companion profile edit | `incomplete` | see Companion Self-Service | |

## Admin

| Sub-feature | Status | Evidence | Notes |
|---|---|---|---|
| Companion vetting/CRUD | `built` | `app/api/admin/companions/*` | |
| Content moderation | `built` | `app/api/admin/content/*` | |
| Tags management | `built` | `app/api/admin/tags/*` | |
| Users management | `built` | `app/api/admin/users/*` | |
| Bookings oversight | `built` | `app/api/admin/bookings/route.ts` | |
| Boosts/ads admin | `built` | `app/api/admin/*boost*` | Not individually spot-checked |
| Activity logs | `unknown — needs check` | `app/(admin)/admin/activity/` | |

## Infra

| Sub-feature | Status | Evidence | Notes |
|---|---|---|---|
| Home feed content | `bug` | `components/HomePageContent.tsx` imports mock `audios`/`stories` from `lib/data.ts` | Live feed still serves fake data |
| NextAuth session | `bug` | commit `6501d3f "add NextAuth session stub"` | Verify real auth works end-to-end |
| Drizzle schema | `built` | `db/schema.ts` — 43 tables | |
| File upload | `incomplete` | `app/api/upload/{file,presigned-url}` — 401 stubs | `lib/r2.ts` + `useUploadToR2` unused until wired |
| Geolocation | `built` | `hooks/useGeolocation.ts` | |
| Gender-personalized home + geo SEO | `built` | `hooks/useDeviceCommunity.ts`, `app/{female,male,shemale}/[country]/[city]` | |
| graphify knowledge graph | `incomplete` | CLAUDE.md references `graphify-out/` — doesn't exist | Dead instruction until `graphify update .` runs |

---

## How to keep this current

Update the matching row before ending any session that touches a route/component/table. Set
`built` once real code lands; only set `built+tested` on explicit human confirmation; add
`bug`/`major-flaw` rows for anything found but not fixed immediately.
