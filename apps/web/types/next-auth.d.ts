import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'user' | 'companion' | 'admin'
      alias: string
      onboarding_complete: boolean
      platform_role: 'dream' | 'dreamer' | null
    } & DefaultSession['user']
  }

  interface User {
    role: 'user' | 'companion' | 'admin'
    alias: string
    onboarding_complete: boolean
    platform_role: 'dream' | 'dreamer' | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: 'user' | 'companion' | 'admin'
    alias: string
    onboarding_complete: boolean
    platform_role: 'dream' | 'dreamer' | null
  }
}
