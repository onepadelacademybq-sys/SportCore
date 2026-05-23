'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type BookingState = { error: string | null; success?: string }

type ProfileRef = { id: string; full_name: string; email: string }
type CourtRef   = { id: string; name: string }

export type Booking = {
  id: string
  start_time: string
  end_time: string
  status: 'pending' | 'paid' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes: string | null
  payment_proof_url: string | null
  price: number
  expires_at: string | null
  created_at: string
  coach:  ProfileRef | null
  player: ProfileRef | null
  court:  CourtRef   | null
}

export type CoachOption = { id: string; full_name: string; email: string }
export type CourtOption = { id: string; name: string; type: string }

// ─── Auth guard ────────────────────────────────────────────────────────────────

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  const profile = data as { id: string; role: string; full_name: string } | null
  if (!profile) redirect('/login')

  return { supabase, userId: user.id, role: profile.role, fullName: profile.full_name }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function cancelExpiredBookings(supabase: SupabaseClient) {
  await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('status', 'pending')
    .not('expires_at', 'is', null)
    .lt('expires_at', new Date().toISOString())
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Coaches activos — para el formulario de solicitud del jugador */
export async function getCoaches(): Promise<CoachOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'coach')
    .eq('is_active', true)
    .order('full_name')
  return (data ?? []) as CoachOption[]
}

/** Canchas activas — para el admin cuando confirma */
export async function getCourts(): Promise<CourtOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courts')
    .select('id, name, type')
    .eq('status', 'active')
    .order('name')
  return (data ?? []) as CourtOption[]
}

/** Reservas del jugador autenticado, ordenadas por fecha descendente */
export async function getPlayerBookings(): Promise<Booking[]> {
  const { supabase, userId } = await requireAuth()
  await cancelExpiredBookings(supabase)
  const { data } = await supabase
    .from('bookings')
    .select(`
      id, start_time, end_time, status, notes, payment_proof_url, price, expires_at, created_at,
      coach:profiles!coach_id(id, full_name, email),
      court:courts!court_id(id, name)
    `)
    .eq('player_id', userId)
    .order('start_time', { ascending: false })
  return (data ?? []) as unknown as Booking[]
}

/** Reservas confirmadas/completadas del entrenador autenticado */
export async function getCoachBookings(): Promise<Booking[]> {
  const { supabase, userId, role } = await requireAuth()
  if (role !== 'coach' && role !== 'admin') redirect('/login')

  const { data } = await supabase
    .from('bookings')
    .select(`
      id, start_time, end_time, status, notes, price, created_at,
      player:profiles!player_id(id, full_name, email),
      court:courts!court_id(id, name)
    `)
    .eq('coach_id', userId)
    .in('status', ['confirmed', 'completed'])
    .order('start_time', { ascending: true })
  return (data ?? []) as unknown as Booking[]
}

/** Todas las reservas — solo admin. Filtro opcional por estado. */
export async function getAllBookings(status?: string): Promise<Booking[]> {
  const { supabase, role } = await requireAuth()
  if (role !== 'admin') redirect('/admin/dashboard')

  await cancelExpiredBookings(supabase)

  let query = supabase
    .from('bookings')
    .select(`
      id, start_time, end_time, status, notes, payment_proof_url, price, expires_at, created_at,
      coach:profiles!coach_id(id, full_name, email),
      player:profiles!player_id(id, full_name, email),
      court:courts!court_id(id, name)
    `)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data } = await query
  return (data ?? []) as unknown as Booking[]
}

/** Bloques ocupados de un entrenador en el rango de fechas dado (para el calendario) */
export async function getCoachAvailability(
  coachId: string,
  weekStart: string,
  weekEnd: string,
): Promise<{ start_time: string; end_time: string }[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('coach_id', coachId)
    .in('status', ['paid', 'confirmed'])
    .lt('start_time', weekEnd)
    .gte('end_time', weekStart)

  return (data ?? []) as { start_time: string; end_time: string }[]
}

// ─── Player: solicitar reserva ─────────────────────────────────────────────────

const RequestSchema = z.object({
  coachId:     z.string().uuid('Selecciona un entrenador válido'),
  date:        z.string().min(1, 'La fecha es requerida'),
  startTime:   z.string().min(1, 'La hora de inicio es requerida'),
  endTime:     z.string().min(1, 'La hora de fin es requerida'),
  notes:       z.string().optional(),
  peopleCount: z.coerce.number().int().min(1).max(4).optional(),
  price:       z.coerce.number().min(0).optional(),
})

export async function requestBookingAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const { supabase, userId, role } = await requireAuth()

  if (role !== 'player' && role !== 'admin') {
    return { error: 'Solo los jugadores pueden solicitar reservas directamente' }
  }

  const parsed = RequestSchema.safeParse({
    coachId:     formData.get('coachId'),
    date:        formData.get('date'),
    startTime:   formData.get('startTime'),
    endTime:     formData.get('endTime'),
    notes:       formData.get('notes') || undefined,
    peopleCount: formData.get('peopleCount') || undefined,
    price:       formData.get('price') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { coachId, date, startTime, endTime, notes, peopleCount, price } = parsed.data
  const start = new Date(`${date}T${startTime}:00`)
  const end   = new Date(`${date}T${endTime}:00`)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: 'Fecha u hora inválida' }
  }

  const advanceMs = role === 'admin' ? 1 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000
  const earliestBookable = new Date(Date.now() + advanceMs)
  if (start < earliestBookable) {
    return {
      error: role === 'admin'
        ? 'El administrador puede reservar con mínimo 1 hora de anticipación'
        : 'Los jugadores deben reservar con mínimo 48 horas de anticipación',
    }
  }

  if (end <= start) return { error: 'La hora de fin debe ser posterior a la de inicio' }

  const durationMin = (end.getTime() - start.getTime()) / 60_000
  if (durationMin < 30)  return { error: 'La duración mínima es 30 minutos' }
  if (durationMin > 120) return { error: 'La duración máxima es 2 horas' }

  // Verificar disponibilidad del entrenador (sin solapamientos activos)
  const { data: conflict } = await supabase
    .from('bookings')
    .select('id')
    .eq('coach_id', coachId)
    .not('status', 'in', '("cancelled")')
    .lt('start_time', end.toISOString())
    .gt('end_time', start.toISOString())
    .limit(1)

  if (conflict && conflict.length > 0) {
    return { error: 'El entrenador ya tiene una reserva en ese horario' }
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const { error } = await supabase.from('bookings').insert({
    player_id:    userId,
    coach_id:     coachId,
    created_by:   userId,
    start_time:   start.toISOString(),
    end_time:     end.toISOString(),
    status:       'pending',
    notes:        notes ?? null,
    price:        price ?? 0,
    people_count: peopleCount ?? 1,
    expires_at:   expiresAt,
  })

  if (error) {
    console.error('[requestBookingAction]', error)
    return { error: 'Error al crear la reserva. Intenta nuevamente.' }
  }

  revalidatePath('/player/bookings')
  return { error: null, success: 'Reserva solicitada. Sube tu comprobante de pago para continuar.' }
}

// ─── Player: subir comprobante de pago ────────────────────────────────────────

const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_PROOF_SIZE       = 5 * 1024 * 1024 // 5 MB

export async function uploadPaymentProofAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const { supabase, userId } = await requireAuth()

  const bookingId = (formData.get('bookingId') as string | null)?.trim()
  if (!bookingId) return { error: 'ID de reserva requerido' }

  const file = formData.get('paymentProof') as File | null
  if (!file || file.size === 0) return { error: 'Selecciona un comprobante de pago' }
  if (!ALLOWED_PROOF_TYPES.includes(file.type))
    return { error: 'Solo se aceptan archivos JPG, PNG o PDF' }
  if (file.size > MAX_PROOF_SIZE)
    return { error: 'El archivo no puede superar 5 MB' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, player_id, status')
    .eq('id', bookingId)
    .single()

  const b = booking as { player_id: string; status: string } | null
  if (!b)                     return { error: 'Reserva no encontrada' }
  if (b.player_id !== userId) return { error: 'Sin permisos' }
  if (b.status !== 'pending') return { error: 'Solo se puede subir comprobante en reservas pendientes' }

  const ext      = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
  const path     = `${bookingId}/${Date.now()}.${ext}`
  const buffer   = await file.arrayBuffer()
  const admin    = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('payment-proofs')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[uploadPaymentProofAction] storage:', uploadError)
    return { error: 'Error al subir el archivo. Intenta nuevamente.' }
  }

  const { error: dbError } = await supabase
    .from('bookings')
    .update({ payment_proof_url: path, status: 'paid' })
    .eq('id', bookingId)

  if (dbError) return { error: 'Error al actualizar la reserva' }

  revalidatePath('/player/bookings')
  return { error: null, success: 'Comprobante enviado. El administrador verificará el pago.' }
}

// ─── Admin: confirmar reserva ─────────────────────────────────────────────────

const ConfirmSchema = z.object({
  bookingId: z.string().uuid(),
  courtId:   z.string().uuid().optional(),
})

export async function confirmBookingAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const { supabase, role } = await requireAuth()
  if (role !== 'admin') return { error: 'Sin permisos' }

  const parsed = ConfirmSchema.safeParse({
    bookingId: formData.get('bookingId'),
    courtId:   formData.get('courtId') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const update: Record<string, unknown> = { status: 'confirmed' }
  if (parsed.data.courtId) update.court_id = parsed.data.courtId

  const { error } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', parsed.data.bookingId)

  if (error) return { error: 'Error al confirmar la reserva' }

  revalidatePath('/admin/bookings')
  return { error: null, success: 'Reserva confirmada.' }
}

// ─── Admin / Player: cancelar reserva ────────────────────────────────────────

export async function cancelBookingAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const { supabase, userId, role } = await requireAuth()

  const bookingId = (formData.get('bookingId') as string | null)?.trim()
  if (!bookingId) return { error: 'ID de reserva requerido' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, player_id, status')
    .eq('id', bookingId)
    .single()

  const b = booking as { player_id: string; status: string } | null
  if (!b) return { error: 'Reserva no encontrada' }

  if (role !== 'admin') {
    if (b.player_id !== userId) return { error: 'Sin permisos para cancelar esta reserva' }
    if (b.status === 'confirmed') {
      return { error: 'Solo el administrador puede cancelar reservas ya confirmadas' }
    }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) return { error: 'Error al cancelar la reserva' }

  revalidatePath(role === 'admin' ? '/admin/bookings' : '/player/bookings')
  return { error: null, success: 'Reserva cancelada.' }
}

// ─── Signed URL para comprobante (admin/player dueño) ─────────────────────────

export async function getPaymentProofUrl(
  bookingId: string,
  storagePath: string,
): Promise<string | null> {
  const { supabase, userId, role } = await requireAuth()

  // Verify access: admin can see any, player can only see their own
  if (role !== 'admin') {
    const { data } = await supabase
      .from('bookings')
      .select('player_id')
      .eq('id', bookingId)
      .single()
    if (!data || (data as { player_id: string }).player_id !== userId) return null
  }

  const admin = createAdminClient()
  const { data } = await admin.storage
    .from('payment-proofs')
    .createSignedUrl(storagePath, 60 * 60) // 1 hora

  return data?.signedUrl ?? null
}
