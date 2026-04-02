// Auth route group layout — no header, no player, no nav.
// Used by: /auth/signin, /auth/onboarding, /auth/error

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
