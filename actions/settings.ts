'use server'

import { requireRole } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type SettingsState = { error: string | null; success?: string }

export type AcademySettingsData = {
  name:        string
  logoUrl:     string | null
  address:     string | null
  phone:       string | null
  email:       string | null
  openingTime: string
  closingTime: string
  minBookingAdvanceHours:    number
  maxBookingAdvanceDays:     number
  cancellationDeadlineHours: number
  terminology: { resource: string; coach: string; player: string }
  slug:        string
  sport:       string
}

function timeToString(date: Date): string {
  const h = date.getUTCHours().toString().padStart(2, '0')
  const m = date.getUTCMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function stringToTime(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(0)
  d.setUTCHours(h, m, 0, 0)
  return d
}

export async function getAcademySettings(): Promise<AcademySettingsData | null> {
  const { organizationId } = await requireRole(['admin'])
  const prisma = getPrisma()

  const [org, settings] = await Promise.all([
    prisma.organization.findUnique({
      where:  { id: organizationId },
      select: { name: true, slug: true, sport: true, logoUrl: true, terminology: true },
    }),
    prisma.academySetting.findUnique({
      where: { organizationId },
    }),
  ])

  if (!org) return null

  const terminology = (org.terminology as { resource: string; coach: string; player: string } | null)
    ?? { resource: 'Espacio', coach: 'Entrenador', player: 'Jugador' }

  return {
    name:        org.name,
    logoUrl:     org.logoUrl ?? null,
    slug:        org.slug,
    sport:       org.sport,
    terminology,
    address:     settings?.address ?? null,
    phone:       settings?.phone ?? null,
    email:       settings?.email ?? null,
    openingTime: settings?.openingTime ? timeToString(settings.openingTime) : '08:00',
    closingTime: settings?.closingTime ? timeToString(settings.closingTime) : '22:00',
    minBookingAdvanceHours:    settings?.minBookingAdvanceHours ?? 2,
    maxBookingAdvanceDays:     settings?.maxBookingAdvanceDays ?? 14,
    cancellationDeadlineHours: settings?.cancellationDeadlineHours ?? 24,
  }
}

// ─── Update general info ──────────────────────────────────────────────────────

const GeneralSchema = z.object({
  name:    z.string().min(2, 'Nombre demasiado corto'),
  address: z.string().optional(),
  phone:   z.string().optional(),
  email:   z.string().email('Email inválido').or(z.literal('')).optional(),
  logoUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
})

export async function updateGeneralSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { organizationId } = await requireRole(['admin'])

  const parsed = GeneralSchema.safeParse({
    name:    formData.get('name'),
    address: formData.get('address') || undefined,
    phone:   formData.get('phone')   || undefined,
    email:   formData.get('email')   || undefined,
    logoUrl: formData.get('logoUrl') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, address, phone, email, logoUrl } = parsed.data
  const prisma = getPrisma()

  await Promise.all([
    prisma.organization.update({
      where: { id: organizationId },
      data:  { name, logoUrl: logoUrl || null },
    }),
    prisma.academySetting.upsert({
      where:  { organizationId },
      update: { address: address ?? null, phone: phone ?? null, email: email || null },
      create: { organizationId, address: address ?? null, phone: phone ?? null, email: email || null },
    }),
  ])

  revalidatePath('/admin/settings')
  return { error: null, success: 'Información actualizada' }
}

// ─── Update schedule & booking rules ─────────────────────────────────────────

const ScheduleSchema = z.object({
  openingTime:               z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  closingTime:               z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  minBookingAdvanceHours:    z.coerce.number().int().min(0).max(168),
  maxBookingAdvanceDays:     z.coerce.number().int().min(1).max(365),
  cancellationDeadlineHours: z.coerce.number().int().min(0).max(168),
}).refine(
  (d) => d.openingTime < d.closingTime,
  { message: 'La hora de apertura debe ser anterior al cierre', path: ['openingTime'] },
)

export async function updateScheduleSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { organizationId } = await requireRole(['admin'])

  const parsed = ScheduleSchema.safeParse({
    openingTime:               formData.get('openingTime'),
    closingTime:               formData.get('closingTime'),
    minBookingAdvanceHours:    formData.get('minBookingAdvanceHours'),
    maxBookingAdvanceDays:     formData.get('maxBookingAdvanceDays'),
    cancellationDeadlineHours: formData.get('cancellationDeadlineHours'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { openingTime, closingTime, ...rules } = parsed.data
  const prisma = getPrisma()

  await prisma.academySetting.upsert({
    where:  { organizationId },
    update: { openingTime: stringToTime(openingTime), closingTime: stringToTime(closingTime), ...rules },
    create: { organizationId, openingTime: stringToTime(openingTime), closingTime: stringToTime(closingTime), ...rules },
  })

  revalidatePath('/admin/settings')
  return { error: null, success: 'Horarios y reglas actualizados' }
}

// ─── Update terminology ───────────────────────────────────────────────────────

const TerminologySchema = z.object({
  resource: z.string().min(2, 'Mínimo 2 caracteres'),
  coach:    z.string().min(2, 'Mínimo 2 caracteres'),
  player:   z.string().min(2, 'Mínimo 2 caracteres'),
})

export async function updateTerminologyAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { organizationId } = await requireRole(['admin'])

  const parsed = TerminologySchema.safeParse({
    resource: formData.get('resource'),
    coach:    formData.get('coach'),
    player:   formData.get('player'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const prisma = getPrisma()
  await prisma.organization.update({
    where: { id: organizationId },
    data:  { terminology: parsed.data },
  })

  revalidatePath('/admin/settings')
  return { error: null, success: 'Terminología actualizada' }
}
