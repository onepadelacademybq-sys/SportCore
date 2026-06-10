'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { creditClasses, debitClass } from '@/actions/wallet'
import { recordBookingFinancials } from '@/actions/finances'
import { createNotification, notifyAdmins } from '@/actions/notifications'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type BookingState = { error: string | null; success?: string; stripeUrl?: string }

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
  module_classes: number | null
  created_at: string
  group_id: string | null
  group: { id: string; name: string } | null
  coach:  ProfileRef | null
  player: ProfileRef | null
  court:  CourtRef   | null
  // present only in admin view
  wallet_credit_slot?: string | null
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
      id, start_time, end_time, status, notes, payment_proof_url, price, expires_at, created_at, group_id,
      coach:profiles!coach_id(id, full_name, email),
      player:profiles!player_id(id, full_name, email),
      court:courts!court_id(id, name),
      group:training_groups!group_id(id, name),
      wallet_credits:wallet_transactions(slot_type, type)
    `)
    .order('start_time', { ascending: true })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data } = await query
  const eightDaysFromNow = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)

  return ((data ?? []) as any[])
    .filter((b) => {
      // Sesiones de grupo pendientes: solo mostrar si ocurren dentro de 8 días
      if (b.group_id && b.status === 'pending') {
        return new Date(b.start_time) <= eightDaysFromNow
      }
      return true
    })
    .map((b) => {
      const credit = (b.wallet_credits ?? []).find((t: any) => t.type === 'credit')
      return {
        ...b,
        wallet_credit_slot: credit?.slot_type ?? null,
        wallet_credits: undefined,
      }
    }) as unknown as Booking[]
}

/** Bloques ocupados de un entrenador en el rango de fechas dado (para el calendario) */
export type BusySlot = { start_time: string; end_time: string; is_group: boolean }

export type CoachAvailabilityResult = {
  busySlots:        BusySlot[]
  availableWindows: { day_of_week: number; start_time: string; end_time: string }[] | null
}

export async function getCoachAvailability(
  coachId: string,
  weekStart: string,
  weekEnd: string,
): Promise<CoachAvailabilityResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { busySlots: [], availableWindows: null }

  // Clases individuales: bloquean solo si están pagadas o confirmadas
  const { data: individualData } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('coach_id', coachId)
    .is('group_id', null)
    .in('status', ['paid', 'confirmed'])
    .lt('start_time', weekEnd)
    .gte('end_time', weekStart)

  const individualBusy: BusySlot[] = (individualData ?? []).map(row => ({
    start_time: row['start_time'] as string,
    end_time:   row['end_time'] as string,
    is_group:   false,
  }))

  // Sesiones grupales: bloquean si el grupo está activo (sin importar status de la reserva)
  const { data: groupData } = await supabase
    .from('bookings')
    .select('start_time, end_time, group:training_groups!group_id(status)')
    .eq('coach_id', coachId)
    .not('group_id', 'is', null)
    .not('status', 'eq', 'cancelled')
    .lt('start_time', weekEnd)
    .gte('end_time', weekStart)

  const groupBusy: BusySlot[] = ((groupData ?? []) as any[])
    .filter(b => b.group?.status === 'active')
    .map(b => ({ start_time: b.start_time, end_time: b.end_time, is_group: true }))

  // Ventanas de disponibilidad del entrenador (horas en que SÍ trabaja)
  const { data: availData } = await supabase
    .from('coach_availability')
    .select('day_of_week, start_time, end_time')
    .eq('coach_id', coachId)
    .order('day_of_week')

  const availableWindows = availData && availData.length > 0
    ? (availData as { day_of_week: number; start_time: string; end_time: string }[])
    : null

  return {
    busySlots: [...individualBusy, ...groupBusy],
    availableWindows,
  }
}

// ─── Player: solicitar reserva ─────────────────────────────────────────────────

const RequestSchema = z.object({
  coachId:       z.string().uuid('Selecciona un entrenador válido'),
  date:          z.string().min(1, 'La fecha es requerida'),
  startTime:     z.string().min(1, 'La hora de inicio es requerida'),
  endTime:       z.string().min(1, 'La hora de fin es requerida'),
  notes:         z.string().optional(),
  peopleCount:   z.coerce.number().int().min(1).max(4).optional(),
  price:         z.coerce.number().min(0).optional(),
  moduleClasses: z.coerce.number().int().refine(v => [0, 8, 16].includes(v)).optional(),
  paymentMethod: z.enum(['transfer', 'wallet', 'stripe']).optional(),
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
    coachId:       formData.get('coachId'),
    date:          formData.get('date'),
    startTime:     formData.get('startTime'),
    endTime:       formData.get('endTime'),
    notes:         formData.get('notes') || undefined,
    peopleCount:   formData.get('peopleCount') || undefined,
    price:         formData.get('price') || undefined,
    moduleClasses: formData.get('moduleClasses') || undefined,
    paymentMethod: formData.get('paymentMethod') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { coachId, date, startTime, endTime, notes, peopleCount, price, moduleClasses, paymentMethod } = parsed.data
  // Offset Colombia (UTC-5) explícito: sin él, Node.js en Vercel (UTC) interpretaría
  // la hora local como UTC, almacenando la reserva 5 horas antes de lo que eligió el jugador.
  const start = new Date(`${date}T${startTime}:00-05:00`)
  const end   = new Date(`${date}T${endTime}:00-05:00`)

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

  // Clases individuales confirmadas/pagadas bloquean el slot
  const { data: individualConflict } = await supabase
    .from('bookings')
    .select('id')
    .eq('coach_id', coachId)
    .is('group_id', null)
    .in('status', ['paid', 'confirmed'])
    .lt('start_time', end.toISOString())
    .gt('end_time', start.toISOString())
    .limit(1)

  // Sesiones grupales de grupo activo también bloquean
  const { data: groupConflictData } = await supabase
    .from('bookings')
    .select('id, group:training_groups!group_id(status)')
    .eq('coach_id', coachId)
    .not('group_id', 'is', null)
    .not('status', 'eq', 'cancelled')
    .lt('start_time', end.toISOString())
    .gt('end_time', start.toISOString())

  const hasGroupConflict = ((groupConflictData ?? []) as any[])
    .some(b => b.group?.status === 'active')

  if ((individualConflict && individualConflict.length > 0) || hasGroupConflict) {
    return { error: 'El entrenador ya tiene una reserva en ese horario' }
  }

  const useWallet  = paymentMethod === 'wallet'
  const useStripe  = paymentMethod === 'stripe'
  // Stripe necesita 30 min mínimo; transferencia 15 min
  const expiresMin = useStripe ? 30 : 15
  const expiresAt  = useWallet ? null : new Date(Date.now() + expiresMin * 60 * 1000).toISOString()
  const initStatus = useWallet ? 'confirmed' : 'pending'

  if (useWallet) {
    const debitError = await debitClass(supabase, userId, '', 'Clase reservada')
    if (debitError) return debitError
  }

  const { data: inserted, error } = await supabase.from('bookings').insert({
    player_id:     userId,
    coach_id:      coachId,
    created_by:    userId,
    start_time:    start.toISOString(),
    end_time:      end.toISOString(),
    status:        initStatus,
    notes:         notes ?? null,
    price:         useWallet ? 0 : (price ?? 0),
    people_count:  peopleCount ?? 1,
    module_classes: moduleClasses && moduleClasses > 0 ? moduleClasses : null,
    expires_at:    expiresAt,
  }).select('id').single()

  if (error || !inserted) {
    console.error('[requestBookingAction]', error)
    if (useWallet) {
      await supabase.from('class_wallet').update({}).eq('player_id', userId)
    }
    return { error: 'Error al crear la reserva. Intenta nuevamente.' }
  }

  const bookingId = (inserted as { id: string }).id

  // Wallet: actualizar transacción + registrar finanzas
  if (useWallet) {
    await supabase
      .from('wallet_transactions')
      .update({ booking_id: bookingId })
      .eq('player_id', userId)
      .is('booking_id', null)
      .order('created_at', { ascending: false })
      .limit(1)

    await recordBookingFinancials(supabase, bookingId, userId)
  }

  const dateLabel = start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeLabel = `${startTime}–${endTime}`

  // Stripe: crear Checkout Session y devolver la URL al cliente
  if (useStripe && process.env.STRIPE_SECRET_KEY) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      const { createBookingCheckoutSession } = await import('@/lib/stripe/checkout')
      const stripeUrl = await createBookingCheckoutSession(
        bookingId,
        price ?? 0,
        (profile as { email: string } | null)?.email ?? '',
        `Reserva de clase · ${dateLabel} ${timeLabel}`,
      )
      revalidatePath('/player/bookings')
      return { error: null, stripeUrl }
    } catch (err) {
      console.error('[requestBookingAction] Stripe checkout:', err)
      // Si Stripe falla, la reserva queda pendiente y el jugador puede subir comprobante
    }
  }

  await notifyAdmins(
    'Nueva reserva solicitada',
    `Se solicitó una reserva para el ${dateLabel} de ${timeLabel}.`,
    'announcement',
    '/admin/bookings',
  )

  revalidatePath('/player/bookings')
  return {
    error: null,
    success: useWallet
      ? 'Reserva confirmada con tu billetera de clases.'
      : 'Reserva solicitada. Sube tu comprobante de pago para continuar.',
  }
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

  await notifyAdmins(
    'Comprobante de pago subido',
    'Un jugador subió su comprobante de pago y espera verificación.',
    'payment_processed',
    '/admin/bookings',
  )

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
  const { supabase, userId, role } = await requireAuth()
  if (role !== 'admin') return { error: 'Sin permisos' }

  const parsed = ConfirmSchema.safeParse({
    bookingId: formData.get('bookingId'),
    courtId:   formData.get('courtId') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { bookingId, courtId } = parsed.data

  // Fetch booking to check module_classes, player_id, coach and times
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, player_id, coach_id, module_classes, start_time, end_time, player:profiles!player_id(full_name)')
    .eq('id', bookingId)
    .single()

  const b = booking as {
    player_id:     string | null
    coach_id:      string | null
    module_classes: number | null
    start_time:    string
    end_time:      string
    player:        { full_name: string } | null
  } | null
  if (!b) return { error: 'Reserva no encontrada' }

  const update: Record<string, unknown> = { status: 'confirmed' }
  if (courtId) update.court_id = courtId

  const { error } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', bookingId)

  if (error) return { error: 'Error al confirmar la reserva' }

  // Credit classes to wallet if this is a module booking
  if (b.player_id && b.module_classes && b.module_classes > 0) {
    await creditClasses(
      supabase,
      b.player_id,
      bookingId,
      b.module_classes,
      `Módulo de ${b.module_classes} clases acreditado`,
    )
  }

  // Registrar ingresos/egresos automáticos de la reserva confirmada
  await recordBookingFinancials(supabase, bookingId, userId)

  const dateLabel  = new Date(b.start_time).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })
  const startLabel = new Date(b.start_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
  const endLabel   = new Date(b.end_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })

  await Promise.all([
    b.player_id
      ? createNotification(b.player_id, 'Reserva confirmada', `Tu reserva del ${dateLabel} de ${startLabel} a ${endLabel} fue confirmada.`, 'booking_confirmed', '/player/bookings')
      : Promise.resolve(),
    b.coach_id
      ? createNotification(b.coach_id, 'Nueva clase confirmada', `Tienes una clase con ${b.player?.full_name ?? 'un jugador'} el ${dateLabel} de ${startLabel} a ${endLabel}.`, 'booking_confirmed', '/coach/bookings')
      : Promise.resolve(),
  ])

  revalidatePath('/admin/bookings')
  revalidatePath('/player/bookings')
  return { error: null, success: 'Reserva confirmada.' }
}

// ─── Helpers para tipo de franja horaria ─────────────────────────────────────

type SlotType = 'am' | 'pm' | 'weekend'

function getSlotType(startTime: string): SlotType {
  const d   = new Date(startTime)
  const day = d.getUTCDay()   // 0=Dom, 6=Sáb
  if (day === 0 || day === 6) return 'weekend'
  return d.getUTCHours() < 16 ? 'am' : 'pm'
}

const SLOT_LABELS: Record<SlotType, string> = {
  am:      'AM',
  pm:      'PM',
  weekend: 'FDS',
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
    .select('id, player_id, coach_id, status, start_time')
    .eq('id', bookingId)
    .single()

  const b = booking as { player_id: string; coach_id: string | null; status: string; start_time: string } | null
  if (!b) return { error: 'Reserva no encontrada' }

  if (role !== 'admin') {
    if (b.player_id !== userId) return { error: 'Sin permisos para cancelar esta reserva' }

    // Reservas pendientes (sin pago aún): cancelación libre, sin crédito wallet
    if (b.status === 'pending') {
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
      if (b.coach_id) {
        const dateLabel = new Date(b.start_time).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
        await createNotification(b.coach_id, 'Reserva cancelada', `Una reserva del ${dateLabel} fue cancelada por el jugador.`, 'booking_cancelled', '/coach/bookings')
      }
      revalidatePath('/player/bookings')
      return { error: null, success: 'Reserva cancelada.' }
    }

    // Reservas pagadas o confirmadas: requieren 24 h de anticipación
    if (b.status === 'paid' || b.status === 'confirmed') {
      const hoursUntil = (new Date(b.start_time).getTime() - Date.now()) / 3_600_000
      if (hoursUntil < 24) {
        return {
          error: `No se puede cancelar con menos de 24 horas de anticipación. La clase está en ${Math.max(0, Math.floor(hoursUntil))}h.`,
        }
      }

      // Cancelar y acreditar 1 clase a la wallet
      const { error: cancelErr } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (cancelErr) return { error: 'Error al cancelar la reserva.' }

      if (b.coach_id) {
        const dateLabel = new Date(b.start_time).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
        await createNotification(b.coach_id, 'Reserva cancelada', `Una reserva del ${dateLabel} fue cancelada por el jugador.`, 'booking_cancelled', '/coach/bookings')
      }

      const slot      = getSlotType(b.start_time)
      const label     = SLOT_LABELS[slot]
      const classDate = new Date(b.start_time).toLocaleDateString('es-CO', {
        day: 'numeric', month: 'short',
      })

      await creditClasses(
        supabase,
        userId,
        bookingId,
        1,
        `Cancelación - clase ${label} del ${classDate}`,
        slot,
      )

      revalidatePath('/player/bookings')
      return {
        error: null,
        success: `Clase cancelada. Se acreditó 1 clase ${label} a tu E-wallet.`,
      }
    }

    return { error: 'Esta reserva no puede cancelarse.' }
  }

  // Admin: cancelación directa sin restricciones
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) return { error: 'Error al cancelar la reserva' }

  const dateLabel = new Date(b.start_time).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  await Promise.all([
    createNotification(b.player_id, 'Reserva cancelada', `Tu reserva del ${dateLabel} fue cancelada por el administrador.`, 'booking_cancelled', '/player/bookings'),
    b.coach_id ? createNotification(b.coach_id, 'Reserva cancelada', `Una reserva del ${dateLabel} fue cancelada por el administrador.`, 'booking_cancelled', '/coach/bookings') : Promise.resolve(),
  ])

  revalidatePath('/admin/bookings')
  revalidatePath('/player/bookings')
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
