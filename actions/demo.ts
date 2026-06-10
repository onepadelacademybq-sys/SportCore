'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const DEMO_CREDENTIALS = {
  admin:   { email: 'demo.admin@sportcore.app',   password: 'Demo2025Admin!',  role: 'admin'  },
  coach:   { email: 'demo.coach1@sportcore.app',  password: 'Demo2025Coach!',  role: 'coach'  },
  player:  { email: 'demo.player1@sportcore.app', password: 'Demo2025Player!', role: 'player' },
} as const

export async function demoLoginAction(role: keyof typeof DEMO_CREDENTIALS) {
  const creds    = DEMO_CREDENTIALS[role]
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email:    creds.email,
    password: creds.password,
  })

  if (error) {
    return { error: 'Demo no disponible. Ejecuta npm run seed:demo primero.' }
  }

  const store = await cookies()
  store.set('x-demo-mode', '1', { path: '/', maxAge: 60 * 60 * 8, sameSite: 'lax' })

  redirect(`/${creds.role}/dashboard`)
}
