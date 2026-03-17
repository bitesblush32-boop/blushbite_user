import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — no Node.js-only imports (no bcrypt, no db)
// Middleware imports this file directly.

export const authConfig = {
  pages: {
    signIn: '/auth/signin',
    error:  '/auth/error',
  },

  callbacks: {
    jwt({ token, user }) {
      // On first sign-in, user object is present — copy custom fields into token
      if (user) {
        token.id                  = user.id as string
        token.role                = (user as any).role ?? 'user'
        token.alias               = (user as any).alias ?? ''
        token.onboarding_complete = (user as any).onboarding_complete ?? false
        token.platform_role       = (user as any).platform_role ?? null
      }
      return token
    },

    session({ session, token }) {
      session.user.id                  = token.id as string
      session.user.role                = token.role as any
      session.user.alias               = token.alias as string
      session.user.onboarding_complete = token.onboarding_complete as boolean
      session.user.platform_role       = token.platform_role as any
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
