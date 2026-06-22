'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export type AuthState = {
  error: string | null
  success?: string
}

// ─── Login ───────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: signInData, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'Email o contraseña incorrectos' }
    }
    if (error.message === 'Email not confirmed') {
      return { error: 'Confirma tu email antes de iniciar sesión' }
    }
    return { error: error.message }
  }

  const userId = signInData.user?.id
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    const role = (profile?.role as 'admin' | 'coach' | 'player' | null) ?? 'player'
    redirect(`/${role}/dashboard`)
  }

  redirect('/player/dashboard')
}

// ─── Register ─────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email:    z.string().email('Ingresa un email válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  fullName: z.string().min(2, 'Nombre demasiado corto'),
})

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = RegisterSchema.safeParse({
    email:    formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { email, password, fullName } = parsed.data

  const supabase = await createClient()

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })
  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return { error: 'Ya existe una cuenta con ese email' }
    }
    if (
      signUpError.message.includes('rate limit') ||
      signUpError.message.includes('over_email_send_rate_limit') ||
      signUpError.message.includes('email rate limit')
    ) {
      return { error: 'Has realizado demasiados intentos. Por favor espera 5 minutos antes de intentarlo de nuevo.' }
    }
    return { error: signUpError.message }
  }

  // user:null + error:null → el email ya existe en Supabase Auth (respuesta "fantasma"
  // para prevenir enumeración de usuarios cuando email confirm está activado)
  if (!signUpData.user) {
    return { error: 'Ya existe una cuenta con ese email. Intenta iniciar sesión.' }
  }

  const userId = signUpData.user.id
  if (!userId) return { error: 'No se pudo crear el usuario' }

  const adminClient = createAdminClient()
  const { data: orgRow } = await adminClient
    .from('organizations')
    .select('id')
    .limit(1)
    .single()
  const orgId = (orgRow as { id: string } | null)?.id ?? null

  const { error: profileError } = await adminClient.from('profiles').insert({
    id: userId,
    email,
    full_name: fullName,
    role: 'player',
    organization_id: orgId,
  })

  if (profileError) {
    return { error: 'Error al crear el perfil. Intenta nuevamente.' }
  }

  // If email confirmation is required, session will be null → redirect to login
  // If auto-confirm is enabled, session exists → go directly to player dashboard
  if (signUpData.session) {
    redirect('/player/dashboard?welcome=1')
  }

  redirect('/login?registered=1')
}

// ─── Logout ───────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete('x-user-role')
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

const ForgotSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
})

export async function forgotPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = ForgotSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
  })

  if (error) return { error: error.message }

  return {
    error: null,
    success: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
  }
}
