import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:                  string
      alias:               string
      platform_role:       string
      onboarding_complete: boolean
      companion_stage:     number
      companion_is_live:   boolean
      companion_legal_signed: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id:                     string
    alias:                  string
    platform_role:          string
    onboarding_complete:    boolean
    companion_stage:        number
    companion_is_live:      boolean
    companion_legal_signed: boolean
    tokenRefreshedAt:       number
  }
}
