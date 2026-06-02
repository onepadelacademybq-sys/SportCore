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

function isMinor(dateOfBirth: string): boolean {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  const age = today.getFullYear() - dob.getFullYear()
  const hadBirthday =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
  return age - (hadBirthday ? 0 : 1) < 18
}

const RegisterSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  fullName: z.string().min(2, 'Nombre demasiado corto'),
  documentId: z.string().min(3, 'Documento inválido'),
  phone: z.string().min(7, 'Teléfono inválido'),
  dateOfBirth: z.string().min(1, 'Fecha de nacimiento requerida'),
  address: z.string().min(5, 'Dirección inválida'),
})

const GuardianSchema = z.object({
  guardianName:         z.string().min(2, 'Nombre del representante requerido'),
  guardianDocument:     z.string().min(3, 'Documento del representante requerido'),
  guardianPhone:        z.string().min(7, 'Teléfono del representante requerido'),
  guardianEmail:        z.string().email('Email del representante inválido'),
  guardianRelationship: z.enum(['padre', 'madre', 'tutor_legal', 'otro'], {
    error: 'Selecciona la relación con el menor',
  }),
  guardianConsent: z.literal('on', {
    error: 'Debes aceptar el tratamiento de datos del menor',
  }),
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

  // Si es menor, validar datos del representante legal
  const minor = isMinor(dateOfBirth)
  let guardianData: z.infer<typeof GuardianSchema> | null = null
  if (minor) {
    const guardianParsed = GuardianSchema.safeParse({
      guardianName:         formData.get('guardianName'),
      guardianDocument:     formData.get('guardianDocument'),
      guardianPhone:        formData.get('guardianPhone'),
      guardianEmail:        formData.get('guardianEmail'),
      guardianRelationship: formData.get('guardianRelationship'),
      guardianConsent:      formData.get('guardianConsent'),
    })
    if (!guardianParsed.success) return { error: guardianParsed.error.issues[0].message }
    guardianData = guardianParsed.data
  }

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

  // Guardar datos del representante legal si es menor
  if (minor && guardianData) {
    const admin = createAdminClient()
    const { error: guardianError } = await admin.from('guardian_profiles').insert({
      minor_id:              userId,
      guardian_name:         guardianData.guardianName,
      guardian_document:     guardianData.guardianDocument,
      guardian_phone:        guardianData.guardianPhone,
      guardian_email:        guardianData.guardianEmail,
      guardian_relationship: guardianData.guardianRelationship,
      consent_accepted:      true,
      consent_date:          new Date().toISOString(),
    })
    if (guardianError) {
      console.error('[registerAction] guardian_profiles:', guardianError)
      // No bloqueamos el registro — el admin puede completar después
    }
  }

  // If email confirmation is required, session will be null → redirect to login
  // If auto-confirm is enabled, session exists → go directly to player dashboard
  if (signUpData.session) {
    redirect('/player/dashboard')
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
