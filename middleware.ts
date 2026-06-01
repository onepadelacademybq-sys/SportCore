import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

type Role = 'admin' | 'coach' | 'player'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password']

const ROLE_DASHBOARD: Record<Role, string> = {
  admin: '/admin/dashboard',
  coach: '/coach/dashboard',
  player: '/player/dashboard',
}

const ROLE_PREFIX: Record<Role, string> = {
  admin: '/admin',
  coach: '/coach',
  player: '/player',
}

// Returns undefined when no valid role found
async function resolveRole(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>['supabase']
): Promise<Role | undefined> {
  // Tier 1: JWT app_metadata claim (set via Supabase custom access token hook)
  const { data: { session } } = await supabase.auth.getSession()
  const jwtRole = session?.user?.app_metadata?.role as Role | undefined
  if (jwtRole && jwtRole in ROLE_DASHBOARD) return jwtRole

  // Tier 2: profiles table lookup (authoritative).
  // No cookie cache: un caché de rol queda obsoleto cuando cambia profiles.role,
  // enrutando con el rol viejo hasta que expira. El layout ya consulta la DB por
  // request, así que esto mantiene la coherencia. Tier 1 (JWT) evita esta query
  // cuando el hook de Supabase esté activo.
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return (data?.role as Role | undefined)
}

// Copies Supabase session cookies from supabaseResponse onto a redirect response
function withSessionCookies(
  redirect: NextResponse,
  supabaseResponse: NextResponse
): NextResponse {
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    redirect.cookies.set(name, value)
  })
  return redirect
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))

  const { supabase, response, user } = await createClient(request)

  // Unauthenticated — let public routes through, redirect everything else to /login
  if (!user) {
    if (isPublic) return response
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return withSessionCookies(NextResponse.redirect(loginUrl), response)
  }

  // Authenticated users hitting public auth pages → send to their dashboard
  if (isPublic) {
    const role = await resolveRole(user.id, supabase)
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = ROLE_DASHBOARD[role ?? 'player']
    return withSessionCookies(NextResponse.redirect(dashboardUrl), response)
  }

  const role = await resolveRole(user.id, supabase)

  // Profile not yet created (race condition right after sign-up)
  if (!role) return response

  // Block access to another role's prefix
  const wrongRole = (Object.keys(ROLE_PREFIX) as Role[]).find(
    (r) => r !== role && pathname.startsWith(ROLE_PREFIX[r])
  )
  if (wrongRole) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = ROLE_DASHBOARD[role]
    return withSessionCookies(NextResponse.redirect(dashboardUrl), response)
  }

  // Redirect bare role roots to their dashboard (e.g. /admin → /admin/dashboard)
  if (pathname === ROLE_PREFIX[role] || pathname === ROLE_PREFIX[role] + '/') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = ROLE_DASHBOARD[role]
    return withSessionCookies(NextResponse.redirect(dashboardUrl), response)
  }

  // Limpia la cookie de rol de versiones anteriores: ya no se usa caché de rol
  // (causaba roles obsoletos). Borrarla evita que vuelva a leerse si se reintroduce.
  if (request.cookies.has('x-user-role')) {
    response.cookies.delete('x-user-role')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
