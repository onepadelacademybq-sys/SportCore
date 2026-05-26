'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

export type ContactState = { error: string | null; success?: string }

const Schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(1000),
})

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: (formData.get('phone') as string) || undefined,
    message: formData.get('message'),
  }

  const parsed = Schema.safeParse(raw)
  if (!parsed.success) return { error: 'Completa todos los campos correctamente.' }

  const admin = createAdminClient()
  const { error } = await admin.from('contact_messages').insert(parsed.data)

  if (error) {
    console.error('[sendContactMessage]', error)
    return { error: 'No se pudo enviar el mensaje. Intenta de nuevo.' }
  }

  return { error: null, success: '¡Mensaje recibido! Te contactaremos pronto.' }
}
