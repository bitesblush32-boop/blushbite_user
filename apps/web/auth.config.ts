import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — no Node.js-only imports (no bcrypt, no db)
// Middleware imports this file directly.

export const authConfig = {
  trustHost: true,

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/error',
  },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id                  = user.id as string
        token.alias               = (user as any).alias ?? ''
        token.onboarding_complete = (user as any).onboarding_complete ?? false
      }
      return token
    },

    session({ session, token }) {
      session.user.id                  = token.id as string
      session.user.alias               = token.alias as string
      session.user.onboarding_complete = token.onboarding_complete as boolean
      return session
    },

    authorized({ auth, request: { nextUrl } }) {
      // Middleware gate — full logic lives in middleware.ts
      // This just enables the auth() wrapper to work in middleware
      return true
    },
  },

  providers: [], // providers are added in auth.ts (Node.js only)
} satisfies NextAuthConfig
