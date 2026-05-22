import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// Usar en Server Components, Server Actions y Route Handlers
// Siempre async porque cookies() es async en Next.js 15
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Si se llama desde un Server Component (sin capacidad de mutar cookies),
            // el middleware ya habrá refrescado la sesión — este error es seguro ignorar
          }
        },
      },
    }
  )
}
