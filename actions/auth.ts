'use server'

import { createClient } from '@/lib/supabase/server'
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
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'Email o contraseña incorrectos' }
    }
    if (error.message === 'Email not confirmed') {
      return { error: 'Confirma tu email antes de iniciar sesión' }
    }
    return { error: error.message }
  }

  redirect('/')
}

// ─── Register ─────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  fullName: z.string().min(2, 'Nombre demasiado corto'),
  documentId: z.string().min(3, 'Documento inválido'),
  phone: z.string().min(7, 'Teléfono inválido'),
  dateOfBirth: z.string().min(1, 'Fecha de nacimiento requerida'),
  address: z.string().min(5, 'Dirección inválida'),
})

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = RegisterSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
    documentId: formData.get('documentId'),
    phone: formData.get('phone'),
    dateOfBirth: formData.get('dateOfBirth'),
    address: formData.get('address'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { email, password, fullName, documentId, phone, dateOfBirth, address } =
    parsed.data

  const supabase = await createClient()

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })
  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return { error: 'Ya existe una cuenta con ese email' }
    }
    if (signUpError.message.includes('rate limit')) {
      return { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.' }
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

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    email,
    full_name: fullName,
    document_id: documentId,
    phone,
    date_of_birth: dateOfBirth,
    address,
    role: 'player',
  })

  if (profileError) {
    return { error: 'Error al crear el perfil. Intenta nuevamente.' }
  }

  // If email confirmation is required, session will be null → redirect to login
  // If auto-confirm is enabled, session exists → middleware handles dashboard redirect
  if (signUpData.session) {
    redirect('/')
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
  redirect('/login')
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
