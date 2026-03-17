# Complete NextAuth v5 authentication guide for an adult platform

**NextAuth v5 (Auth.js) supports credentials, Google, and Twitter/X providers simultaneously using JWT sessions, a Drizzle ORM schema with role-based access, and the `allowDangerousEmailAccountLinking` flag for multi-provider account linking.** OnlyFans itself uses **email + password** (not username) for credential-based login, backed by bcrypt hashing, server-side sessions, and Cloudflare Turnstile for bot protection. This guide covers the full implementation stack: from database schema through OAuth setup to brute-force protection.

---

## How OnlyFans handles credential authentication

OnlyFans requires **email + password** at login — not a username. Usernames are auto-generated during registration (formatted as `u` + numeric ID) and can be customized later, but the login form accepts only the registered email address. The platform also offers Google OAuth, Twitter/X OAuth, and passkey-based login (added ~2023), which notably does use the username as identifier.

The underlying architecture follows a standard server-side session pattern. The client sends credentials over HTTPS, the server validates them against a stored bcrypt hash, and on success generates a cryptographically random session token stored server-side (likely Redis). The `sess` cookie (HttpOnly, Secure, SameSite) is set on the response, and every subsequent request is validated against the session store. OnlyFans adds layers beyond this: **Cloudflare Turnstile CAPTCHA** before login submission, optional TOTP-based 2FA, device fingerprinting via an `fp` cookie, and custom headers (`x-bc`, `app-token`) for internal API requests. Sessions appear to last approximately 7 days and are tied to device fingerprints and IP patterns.

This pattern — credential validation → session creation → cookie-based state — is exactly what you'll replicate with NextAuth v5, except NextAuth uses encrypted JWTs in cookies rather than server-side session storage.

---

## NextAuth v5 credentials provider implementation

The core architectural decision in NextAuth v5 with App Router is the **two-file config split**: `auth.config.ts` holds edge-compatible configuration (used by middleware), while `auth.ts` adds providers that require Node.js APIs like `bcrypt`. This split exists because middleware runs on the Edge runtime, which cannot execute Node.js-specific packages.

### File structure and auth.ts configuration

```
project-root/
├── auth.config.ts          # Edge-safe config (middleware uses this)
├── auth.ts                 # Full config with providers + bcrypt
├── middleware.ts            # Route protection
├── app/api/auth/[...nextauth]/route.ts  # Two-line handler
├── db/schema.ts            # Drizzle ORM schema
└── .env.local
```

The `auth.ts` file is the heart of the system. Here is the complete configuration with all three providers, role-based JWT callbacks, and bcrypt password comparison:

```typescript
// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },  // REQUIRED for credentials provider
  pages: { signIn: "/login" },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    Twitter({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }).safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).role = token.role;
      return session;
    },
  },
});
```

### How authorize() works

The `authorize()` callback receives a `credentials` object containing string values from the submitted form fields. It must return a **user object** on success (which flows into the JWT) or **`null`** on failure. Returning `null` triggers a redirect to the error page with a `CredentialsSignin` error type. The user object must include at minimum an `id` string; `name`, `email`, and `image` are optional. Custom fields like `role` can be added and forwarded through the `jwt()` → `session()` callback chain.

For **bcrypt password hashing on signup**, hash with a cost factor of **12 rounds** (the current recommended minimum):

```typescript
// Registration server action
const hashedPassword = await bcrypt.hash(password, 12);
await db.insert(users).values({
  id: crypto.randomUUID(),
  name,
  email,
  hashedPassword,
  role: "user",
});
```

The API route handler is just two lines — `import { handlers } from "@/auth"` then `export const { GET, POST } = handlers`. The middleware imports only from `auth.config.ts` to stay edge-compatible.

---

## JWT sessions are the right choice for role-based access

**The Credentials provider requires JWT session strategy** — this is not optional. Database sessions don't work with credentials because the Credentials provider does not persist users through the adapter's `createUser` method. But even if you could choose, JWT is the better fit for a role-based adult platform for several reasons.

With JWT strategy, the role string (`"user"`, `"companion"`, or `"admin"`) is embedded directly in the encrypted token cookie. Every session check decrypts the cookie locally — **no database round-trip required**. This works in middleware for route protection, enabling you to block `/admin` routes at the edge before they even reach your server. Database sessions cannot be read in middleware at all.

The flow is: `authorize()` returns user with role → `jwt()` callback stores `role` in the token (only on first sign-in) → `session()` callback copies `token.role` to `session.user.role` → `auth()` or `useSession()` exposes the role. On subsequent requests, the `jwt()` callback runs again but without the `user` parameter — the previously stored `token.role` persists.

The one trade-off: **you cannot instantly revoke JWT sessions** (e.g., banning a user mid-session). Mitigate this with shorter `maxAge` values (e.g., 7 days instead of 30) and optionally a Redis-backed token blocklist checked in the `jwt()` callback.

---

## Drizzle ORM schema for multi-provider authentication

NextAuth v5 requires four tables: `users`, `accounts`, `sessions`, and `verificationTokens`. The `users` table stores one row per human regardless of how many providers they use. The `accounts` table stores one row per OAuth provider link. For credentials auth, you extend the users table with `username`, `hashedPassword`, and a custom `role` enum.

```typescript
// db/schema.ts
import {
  timestamp, pgTable, text, primaryKey,
  integer, pgEnum,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "@auth/core/adapters";

export const roleEnum = pgEnum("role", ["user", "companion", "admin"]);

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // Custom columns for credentials auth
  username: text("username").unique(),
  hashedPassword: text("hashedPassword"),
  role: roleEnum("role").default("user").notNull(),
});

export const accounts = pgTable("account", {
  userId: text("userId").notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<AdapterAccountType>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId],
  }),
}));

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));
```

The `accounts` table uses a **composite primary key** on `(provider, providerAccountId)`, meaning one user can have rows for `google`, `twitter`, and no row for credentials (credentials don't create account entries — they validate directly against `users.hashedPassword`).

---

## Account linking across Google, Twitter, and credentials

By default, if a user signs up with Google and later tries to sign in with Twitter using the same email, NextAuth throws an **`OAuthAccountNotLinked`** error. This is a security measure — NextAuth can't guarantee two OAuth providers verified the same email belongs to the same person.

Enable automatic linking by setting `allowDangerousEmailAccountLinking: true` on each OAuth provider. Despite the scary name, this is standard practice when using trusted providers like Google (which verifies emails). When enabled, NextAuth matches users by email and creates additional rows in the `accounts` table linking the new provider to the existing user.

For **credentials + OAuth linking**, the scenario works like this: a user registers with email/password (creating a row in `users` with `hashedPassword`), then later clicks "Sign in with Google" using the same email. With `allowDangerousEmailAccountLinking: true`, NextAuth finds the existing user by email, creates an `accounts` row linking Google, and signs them in. The user can now authenticate with either method.

One critical detail: **the Credentials provider does not use the adapter** — it doesn't call `createUser()` or `linkAccount()`. You must manually create users during registration via a separate API route or server action. OAuth providers handle user creation automatically through the adapter.

---

## Setting up Twitter/X and Google OAuth credentials

### Twitter/X OAuth setup

Go to **developer.twitter.com**, create a developer account, and create a Project with an App. The **Free tier ($0)** supports OAuth 2.0 and is sufficient for authentication-only use. In your App's settings, configure User Authentication:

Set **App Permissions** to "Read" and **Type of App** to **"Web App"** (confidential client — this is required for NextAuth since it holds the client secret server-side). Set the callback URL to `http://localhost:3000/api/auth/callback/twitter` for development and your production URL for deployment. Find your **OAuth 2.0 Client ID and Client Secret** under Keys and Tokens — the secret is shown only once, so copy it immediately.

NextAuth v5 uses **OAuth 2.0 with PKCE** for Twitter by default (no `version: "2.0"` flag needed like in v4). One significant limitation: **Twitter OAuth 2.0 does not return the user's email address**. If you need email for account linking, you'll need to collect it separately or rely on Google as the primary email source.

### Google OAuth setup

Go to **console.cloud.google.com**, create a project, then navigate to APIs & Services → OAuth consent screen. Select **"External"** user type, fill in your app name and support email. For scopes, the defaults (`openid`, `email`, `profile`) are non-sensitive and don't require Google's full verification review.

Under Credentials → Create OAuth Client ID, select **"Web application"**. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Copy the Client ID and Client Secret immediately — **Google now hashes secrets after creation** and won't show them again.

Regarding adult/18+ platforms: **Google does not explicitly prohibit using OAuth for adult content sites**. Their OAuth policies focus on accurate branding, privacy policy requirements, and proper scope usage — not content restrictions. The practical recommendation is to keep your sign-in page clean and professional, with explicit content behind the authentication wall, since Google reviews your homepage during brand verification.

---

## Environment variables for NextAuth v5

```bash
# Core (required)
AUTH_SECRET="generate-with-npx-auth-secret-or-openssl-rand-base64-32"

# Google OAuth
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Twitter/X OAuth
AUTH_TWITTER_ID="your-twitter-oauth2-client-id"
AUTH_TWITTER_SECRET="your-twitter-oauth2-client-secret"

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"

# Optional (auto-detected on Vercel and localhost:3000)
# AUTH_URL="http://localhost:3000"
# AUTH_TRUST_HOST=true  (set in production behind a reverse proxy)
```

Auth.js v5 **auto-infers** provider credentials from the `AUTH_{PROVIDER}_{ID|SECRET}` naming pattern. With these env vars set, your provider config simplifies to `Google({ allowDangerousEmailAccountLinking: true })` — no `clientId` or `clientSecret` parameters needed. Generate `AUTH_SECRET` with `npx auth secret` or `openssl rand -base64 32`. Never prefix these with `NEXT_PUBLIC_` — they are server-side secrets.

---

## Rate limiting and brute-force protection

NextAuth provides **zero built-in rate limiting** for the credentials provider. The maintainers have explicitly stated this is the developer's responsibility. Implement a defense-in-depth strategy with these layers:

**Layer 1 — Upstash Redis rate limiting.** Use `@upstash/ratelimit` with a sliding window algorithm, which prevents the burst-at-boundary problem that fixed windows allow. For login endpoints, configure **5 requests per 15 minutes** per IP+username combination:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const authLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
});

// In your login handler or authorize():
const { success } = await authLimiter.limit(`auth_${ip}_${email}`);
if (!success) return new Response("Too many attempts", { status: 429 });
```

**Layer 2 — Account lockout.** Track failed attempts in Redis with auto-expiring keys. Lock the account for **20–30 minutes** after 5 consecutive failures. Use temporary lockouts only — permanent lockouts can be weaponized as a denial-of-service attack against legitimate users.

**Layer 3 — Progressive CAPTCHA.** Show Cloudflare Turnstile (free, privacy-friendly) after 3 failed attempts rather than on every login. OWASP recommends this graduated approach for better user experience.

**Layer 4 — Password security.** Use bcrypt with a cost factor of **12–14** (targeting 250–500ms per hash). Check passwords against the **Have I Been Pwned API** during registration using k-anonymity (send only the first 5 characters of the SHA-1 hash). Enforce a minimum length of 8 characters (12+ recommended) but don't require complexity rules — NIST 800-63B deprecated uppercase/special character requirements in favor of length and breach checking.

NextAuth handles CSRF protection automatically using the double-submit cookie method. Session cookies are set with `httpOnly`, `secure`, and `sameSite: 'lax'` by default, and JWT tokens are encrypted with AES-256-GCM. For production, add security headers: `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a `Content-Security-Policy` that restricts script sources.

---

## Conclusion

The complete stack — NextAuth v5 with JWT sessions, Drizzle ORM on PostgreSQL, and all three providers — works as a cohesive system where the `users` table is the single source of identity and the `accounts` table maps OAuth providers to users. The Credentials provider bypasses the adapter entirely, validating directly against `hashedPassword` in the users table, which is why JWT strategy is mandatory.

Two implementation details deserve special attention. First, **Twitter OAuth 2.0 does not return email**, so account linking between Twitter and other providers requires either collecting email separately or using an alternative matching strategy. Second, the `auth.config.ts` / `auth.ts` split is not optional — putting bcrypt in a file that middleware imports will crash the Edge runtime. Keep the `authorized()` callback and JWT/session callbacks in `auth.config.ts` so middleware can read role data for route protection.

For an adult platform specifically, the combination of Upstash rate limiting, bcrypt cost factor 12+, HIBP breach checking, and Cloudflare Turnstile provides strong protection without degrading the login experience. Google OAuth works for adult sites with no explicit policy prohibition — just keep explicit content behind the auth wall during the consent screen review process.