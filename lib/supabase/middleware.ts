import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

// Crear el cliente de Supabase para usarlo dentro del middleware de Next.js.
// Devuelve el cliente, la respuesta con cookies de sesión actualizadas, y el usuario.
export async function createClient(request: NextRequest) {
  // supabaseResponse se va mutando dentro de setAll cada vez que Supabase rota tokens
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Primero actualizar la request (para que la siguiente lectura de cookies sea fresca)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Luego crear una nueva respuesta y setear en ella las cookies de sesión
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRÍTICO: getUser() debe llamarse siempre aquí para refrescar el token JWT.
  // No agregar lógica entre createServerClient y getUser() — puede causar
  // cierres de sesión inesperados difíciles de depurar.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, response: supabaseResponse, user }
}
