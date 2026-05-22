import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// TODO: Replace with Supabase session check and role-based redirect
// Roles: admin → /admin/dashboard | coach → /coach/dashboard | player → /player/dashboard
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
