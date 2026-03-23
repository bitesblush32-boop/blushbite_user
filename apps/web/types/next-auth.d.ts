import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      alias: string
      onboarding_complete: boolean
    } & DefaultSession['user']
  }

  interface User {
    alias: string
    onboarding_complete: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    alias: string
    onboarding_complete: boolean
  }
}
