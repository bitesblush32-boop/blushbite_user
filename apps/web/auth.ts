import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Twitter from 'next-auth/providers/twitter'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

import { authConfig } from './auth.config'
import { db } from './db'
import { users, accounts, sessions, verificationTokens } from './db/schema'
import { generateAlias } from './lib/alias'

const credentialsSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: DrizzleAdapter(db, {
    usersTable:              users,
    accountsTable:           accounts,
    sessionsTable:           sessions,
    verificationTokensTable: verificationTokens,
  }),

  session: { strategy: 'jwt' }, // REQUIRED for credentials provider

  callbacks: {
    // Re-declare session callback from authConfig (jwt override below replaces the whole object)
    session: authConfig.callbacks!.session as any,
    authorized: authConfig.callbacks!.authorized as any,

    async jwt({ token, user }) {
      // First sign-in — user object is present, copy fields into token
      if (user) {
        token.id                  = user.id as string
        token.role                = (user as any).role ?? 'user'
        token.alias               = (user as any).alias ?? ''
        token.onboarding_complete = (user as any).onboarding_complete ?? false
        token.platform_role       = (user as any).platform_role ?? null
        return token
      }

      // Subsequent requests — verify the user still exists in DB.
      // If the DB row was manually deleted, this returns null which
      // invalidates the session cookie → middleware redirects to sign-in.
      if (token.id) {
        const row = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1)
        if (!row.length) return null
      }

      return token
    },
  },

  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),

    Twitter({
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        })

        if (!user || !user.hashedPassword) return null

        const isValid = await bcrypt.compare(password, user.hashedPassword)
        if (!isValid) return null

        return {
          id:                  user.id,
          email:               user.email,
          name:                user.name,
          role:                user.role,
          alias:               user.alias ?? '',
          onboarding_complete: user.onboarding_complete,
          platform_role:       user.platform_role ?? null,
        }
      },
    }),
  ],

  events: {
    async createUser({ user }) {
      if (!user.id) return
      let alias = generateAlias()
      let attempts = 0
      while (attempts < 10) {
        const conflict = await db.query.users.findFirst({ where: eq(users.alias, alias) })
        if (!conflict) break
        alias = generateAlias()
        attempts++
      }
      await db.update(users).set({ alias }).where(eq(users.id, user.id))
    },
  },
})
