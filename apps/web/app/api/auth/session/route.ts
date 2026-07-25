import { NextResponse } from 'next/server'

// Stub NextAuth session endpoint.
// The app uses a custom JWT cookie system (bb_dreamer_session) rather than NextAuth,
// but several components still import useSession() from next-auth/react.
// SessionProvider polls this endpoint on mount and window focus — returning null
// tells it the user is unauthenticated, which components already handle gracefully.
// Without this stub every poll returned 404, spamming the dev log.
export async function GET() {
  return NextResponse.json(null)
}
