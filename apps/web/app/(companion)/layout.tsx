// Companion route group layout — no dreamer Header/MiniPlayer.
// Used by: /companion/onboarding/identity, /companion/onboarding/verify,
//          /companion/dashboard, /companion/profile, etc.
// Each companion page manages its own chrome (auth cards, sidebar in future).

export default function CompanionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
