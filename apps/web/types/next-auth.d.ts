import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      alias: string
      onboarding_complete: boolean
      platform_role?: 'dreamer' | 'companion' | 'admin'
      companion_stage?: number
      companion_is_live?: boolean
      companion_legal_signed?: boolean
    } & DefaultSession['user']
    error?: string
  }

  interface User {
    alias: string
    onboarding_complete: boolean
    platform_role?: 'dreamer' | 'companion' | 'admin'
    companion_stage?: number
    companion_is_live?: boolean
    companion_legal_signed?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    alias: string
    onboarding_complete: boolean
    platform_role?: string
    companion_stage?: number
    companion_is_live?: boolean
    companion_legal_signed?: boolean
  }
}
