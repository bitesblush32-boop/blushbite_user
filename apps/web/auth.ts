import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Twitter from 'next-auth/providers/twitter'
import Credentials from 'next-auth/providers/credentials'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

import { authConfig } from './auth.config'
import { db } from './db'
import { users, userAccounts, userProfiles, companions, companionProfiles } from './db/schema'
import { generateAlias } from './lib/alias'

const credentialsSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  // No adapter — sessions and verificationTokens tables removed.
  // JWT strategy only. OAuth user creation is handled manually in jwt callback.

  session: { strategy: 'jwt' },

  callbacks: {
    session:    authConfig.callbacks!.session    as any,
    authorized: authConfig.callbacks!.authorized as any,

    async jwt({ token, user, account, profile }) {

      // ── Credentials sign-in ──────────────────────────────────────────────
      // user is present and account.type === 'credentials' (or account is null)
      if (user && (!account || account.type === 'credentials')) {
        token.id                  = user.id as string
        token.alias               = (user as any).alias ?? ''
        token.onboarding_complete = (user as any).onboarding_complete ?? false
        token.platform_role       = (user as any).platform_role ?? 'dreamer'
        return token
      }

      // ── OAuth sign-in ────────────────────────────────────────────────────
      // account is present with provider info — look up or create DB user
      if (account && account.type !== 'credentials') {
        const email = (token.email ?? (profile as any)?.email ?? '') as string
        if (!email) {
          token.error = 'OAuthEmailMissing'
          return token
        }

        // Look up existing user by email
        let dbUser = await db.query.users.findFirst({
          where: eq(users.email, email),
        })

        if (!dbUser) {
          // Create new user
          const inserted = await db.insert(users).values({
            email,
            name:  (profile as any)?.name  ?? token.name  ?? null,
            image: (profile as any)?.picture ?? (profile as any)?.image ?? null,
          }).returning()
          dbUser = inserted[0]

          // Generate unique alias
          let alias = generateAlias()
          for (let i = 0; i < 10; i++) {
            const conflict = await db.query.users.findFirst({ where: eq(users.alias, alias) })
            if (!conflict) break
            alias = generateAlias()
          }
          await db.update(users).set({ alias }).where(eq(users.id, dbUser.id))
          dbUser = { ...dbUser, alias }
        }

        // Upsert user_accounts record
        await db.insert(userAccounts).values({
          user_id:             dbUser.id,
          provider:            account.provider,
          provider_account_id: account.providerAccountId,
          type:                account.type,
          refresh_token:       account.refresh_token       ?? null,
          access_token:        account.access_token        ?? null,
          expires_at:          account.expires_at          ?? null,
          token_type:          account.token_type          ?? null,
          scope:               account.scope               ?? null,
          id_token:            account.id_token            ?? null,
          session_state:       (account.session_state as string) ?? null,
        }).onConflictDoUpdate({
          target: [userAccounts.provider, userAccounts.provider_account_id],
          set: {
            access_token:  account.access_token  ?? null,
            refresh_token: account.refresh_token ?? null,
            expires_at:    account.expires_at    ?? null,
          },
        })

        token.id                  = dbUser.id
        token.alias               = dbUser.alias ?? ''
        token.onboarding_complete = dbUser.onboarding_complete

        // Read platform_role from user_profiles
        const oauthProfile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.user_id, dbUser.id),
        })
        token.platform_role = oauthProfile?.platform_role ?? 'dreamer'

        return token
      }

      // ── Subsequent requests — verify user still exists ───────────────────
      if (token.id) {
        const row = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1)
        if (!row.length) return null

        // Refresh platform_role
        const profileRow = await db
          .select({ platform_role: userProfiles.platform_role })
          .from(userProfiles)
          .where(eq(userProfiles.user_id, token.id as string))
          .limit(1)
        token.platform_role = profileRow[0]?.platform_role ?? undefined

        // If companion, refresh stage + is_live
        if (token.platform_role === 'companion' && token.email) {
          const companionRow = await db
            .select({
              companion_stage: companions.companion_stage,
              is_live:         companionProfiles.is_live,
            })
            .from(companions)
            .leftJoin(companionProfiles, eq(companionProfiles.companion_id, companions.id))
            .where(eq(companions.email, token.email as string))
            .limit(1)
          token.companion_stage   = companionRow[0]?.companion_stage ?? 1
          token.companion_is_live = companionRow[0]?.is_live ?? false
        }
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

        if (!user || !user.hashed_password) return null

        const isValid = await bcrypt.compare(password, user.hashed_password)
        if (!isValid) return null

        const userProfile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.user_id, user.id),
        })

        return {
          id:                  user.id,
          email:               user.email,
          name:                user.name,
          alias:               user.alias               ?? '',
          onboarding_complete: user.onboarding_complete,
          platform_role:       (userProfile?.platform_role ?? 'dreamer') as 'dreamer' | 'companion' | 'admin',
        }
      },
    }),
  ],
})
