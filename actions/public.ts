'use server'

import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PublicOrg = {
  id:          string
  name:        string
  slug:        string
  sport:       string
  logo_url:    string | null
  terminology: { resource: string; coach: string; player: string }
  status:      string
  settings: {
    address:      string | null
    phone:        string | null
    email:        string | null
    opening_time: string | null
    closing_time: string | null
  } | null
  courts: PublicCourt[]
}

export type PublicCourt = {
  id:            string
  name:          string
  resource_type: string
  type:          string
  status:        string
  hourly_rate:   number
}

export type TimeSlot = {
  start:     string   // "HH:MM"
  end:       string   // "HH:MM"
  available: boolean
}

export type BookingRequestState = {
  success:   boolean
  error:     string | null
  bookingId?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSlots(openTime: string, closeTime: string): Array<{ start: string; end: string }> {
  const [oh, om] = openTime.split(':').map(Number)
  const [ch, cm] = closeTime.split(':').map(Number)
  const openMin  = oh * 60 + (om || 0)
  const closeMin = ch * 60 + (cm || 0)
  const slots: Array<{ start: string; end: string }> = []
  for (let m = openMin; m + 60 <= closeMin; m += 60) {
    const sh = Math.floor(m / 60).toString().padStart(2, '0')
    const sm = (m % 60).toString().padStart(2, '0')
    const eh = Math.floor((m + 60) / 60).toString().padStart(2, '0')
    const em = ((m + 60) % 60).toString().padStart(2, '0')
    slots.push({ start: `${sh}:${sm}`, end: `${eh}:${em}` })
  }
  return slots
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getPublicOrg(slug: string): Promise<PublicOrg | null> {
  const supabase = createAdminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, sport, logo_url, terminology, status')
    .eq('slug', slug)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (!org) return null

  const [settingsRes, courtsRes] = await Promise.all([
    supabase
      .from('academy_settings')
      .select('address, phone, email, opening_time, closing_time')
      .eq('organization_id', org.id)
      .maybeSingle(),
    supabase
      .from('courts')
      .select('id, name, resource_type, type, status, hourly_rate')
      .eq('organization_id', org.id)
      .eq('status', 'active')
      .order('name'),
  ])

  return {
    id:          org.id,
    name:        org.name,
    slug:        org.slug,
    sport:       org.sport,
    logo_url:    org.logo_url,
    terminology: (org.terminology as PublicOrg['terminology']) ?? { resource: 'Espacio', coach: 'Entrenador', player: 'Jugador' },
    status:      org.status,
    settings:    settingsRes.data as PublicOrg['settings'],
    courts:      (courtsRes.data ?? []) as PublicCourt[],
  }
}

export async function getPublicSlots(
  orgId: string,
  courtId: string,
  date: string,
): Promise<TimeSlot[]> {
  const supabase = createAdminClient()

  const [settingsRes, bookingsRes] = await Promise.all([
    supabase
      .from('academy_settings')
      .select('opening_time, closing_time')
      .eq('organization_id', orgId)
      .maybeSingle(),
    supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('court_id', courtId)
      .eq('organization_id', orgId)
      .neq('status', 'cancelled')
      .gte('start_time', `${date}T00:00:00-05:00`)
      .lt('start_time', `${date}T23:59:59-05:00`),
  ])

  const openTime  = (settingsRes.data?.opening_time as string | null) ?? '08:00:00'
  const closeTime = (settingsRes.data?.closing_time as string | null) ?? '22:00:00'

  const allSlots = generateSlots(openTime, closeTime)

  const busyRanges = ((bookingsRes.data ?? []) as { start_time: string; end_time: string }[]).map((b) => {
    const s = new Date(b.start_time)
    const e = new Date(b.end_time)
    return {
      startMin: s.getHours() * 60 + s.getMinutes(),
      endMin:   e.getHours() * 60 + e.getMinutes(),
    }
  })

  const now = new Date()
  const isToday = date === now.toISOString().slice(0, 10)
  const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0

  return allSlots.map(({ start, end }) => {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const slotStart = sh * 60 + (sm || 0)
    const slotEnd   = eh * 60 + (em || 0)

    const isPast    = isToday && slotStart <= nowMinutes
    const isBusy    = busyRanges.some(({ startMin, endMin }) => slotStart < endMin && slotEnd > startMin)
    return { start, end, available: !isPast && !isBusy }
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function requestPublicBooking(
  _prev: BookingRequestState,
  formData: FormData,
): Promise<BookingRequestState> {
  const orgId      = (formData.get('org_id')      as string | null)?.trim()
  const courtId    = (formData.get('court_id')    as string | null)?.trim()
  const date       = (formData.get('date')        as string | null)?.trim()
  const slotStart  = (formData.get('slot_start')  as string | null)?.trim()
  const slotEnd    = (formData.get('slot_end')    as string | null)?.trim()
  const guestName  = (formData.get('guest_name')  as string | null)?.trim()
  const guestEmail = (formData.get('guest_email') as string | null)?.trim()
  const guestPhone = (formData.get('guest_phone') as string | null)?.trim()
  const notes      = (formData.get('notes')       as string | null)?.trim()

  if (!orgId || !courtId || !date || !slotStart || !slotEnd) {
    return { success: false, error: 'Selecciona una cancha, fecha y horario.' }
  }
  if (!guestName || !guestEmail) {
    return { success: false, error: 'Tu nombre y correo electrónico son requeridos.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    return { success: false, error: 'Ingresa un correo electrónico válido.' }
  }

  const startTime = new Date(`${date}T${slotStart}:00-05:00`)
  const endTime   = new Date(`${date}T${slotEnd}:00-05:00`)

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return { success: false, error: 'Fecha u hora inválida.' }
  }

  const supabase = createAdminClient()

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', orgId)
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  if (!adminProfile) return { success: false, error: 'No se pudo procesar la solicitud. Intenta más tarde.' }

  const combinedNotes = [
    `[Reserva pública] ${guestName}`,
    guestEmail,
    guestPhone,
    notes,
  ].filter(Boolean).join(' · ')

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      organization_id: orgId,
      court_id:        courtId,
      created_by:      adminProfile.id,
      start_time:      startTime.toISOString(),
      end_time:        endTime.toISOString(),
      status:          'pending',
      notes:           combinedNotes,
      price:           0,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: 'No se pudo crear la solicitud. Intenta de nuevo.' }
  }

  return { success: true, error: null, bookingId: data.id }
}
