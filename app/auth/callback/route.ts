import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ROLE_DASHBOARD = {
  admin:  '/admin/dashboard',
  coach:  '/coach/dashboard',
  player: '/player/dashboard',
} as const

// Handles Supabase email-confirmation redirects (PKCE flow).
// Supabase sends the user here with ?code=... after they click the link.
export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = (profile?.role as keyof typeof ROLE_DASHBOARD) ?? 'player'
      return NextResponse.redirect(new URL(ROLE_DASHBOARD[role], request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=confirmation', request.url))
}
