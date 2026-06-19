'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import {
  sendTextMessage,
  sendBookingConfirmed,
  sendClassReminder,
  sendPaymentDue,
  sendRetentionAlert,
  sendWelcome,
  normalizePhone,
} from '@/lib/whatsapp'
import type {
  LeadStatus,
  LeadSource,
  InteractionType,
} from '@/app/generated/prisma/enums'

const prisma = getPrisma()

// ── Helpers ────────────────────────────────────────────────────────────────

async function getAuthContext(): Promise<{ userId: string; organizationId: string }> {
  const { userId, organizationId } = await requireAuth()
  return { userId, organizationId }
}

// ── LEADS ──────────────────────────────────────────────────────────────────

export async function createLead(data: {
  name: string
  phone: string
  whatsapp?: string
  email?: string
  source?: LeadSource
  sport?: string
  notes?: string
}) {
  const { userId, organizationId } = await getAuthContext()

  const lead = await prisma.lead.create({
    data: {
      ...data,
      organizationId,
      assignedTo: userId,
    },
  })

  // Si tiene WhatsApp, envía mensaje de primer contacto automático
  const waPhone = data.whatsapp ?? data.phone
  if (waPhone) {
    await sendTextMessage({
      to: waPhone,
      text: `¡Hola ${data.name}! 👋 Gracias por tu interés. Somos del equipo y en breve te contactamos para contarte más sobre nuestras clases. ¿Tienes alguna pregunta?`,
    })

    await prisma.interaction.create({
      data: {
        leadId: lead.id,
        type: 'whatsapp_sent',
        summary: 'Mensaje de bienvenida automático enviado al prospecto',
        createdBy: userId,
      },
    })
  }

  revalidatePath('/admin/crm')
  return lead
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  options?: { notes?: string; lostReason?: string; profileId?: string }
) {
  const { userId } = await getAuthContext()

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      lostReason: options?.lostReason,
      profileId: options?.profileId,
      convertedAt: status === 'converted' ? new Date() : undefined,
    },
  })

  await prisma.interaction.create({
    data: {
      leadId,
      type: 'follow_up',
      summary: options?.notes ?? `Estado actualizado a: ${status}`,
      createdBy: userId,
    },
  })

  revalidatePath('/admin/crm')
  return lead
}

export async function getLeads(status?: LeadStatus) {
  return prisma.lead.findMany({
    where: status ? { status } : undefined,
    include: {
      interactions: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getLeadInteractions(leadId: string) {
  return prisma.interaction.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProfileInteractions(profileId: string) {
  return prisma.interaction.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateLead(
  leadId: string,
  data: {
    name?: string
    phone?: string
    whatsapp?: string | null
    email?: string | null
    sport?: string | null
    notes?: string | null
  }
) {
  await getAuthContext()
  const lead = await prisma.lead.update({ where: { id: leadId }, data })
  revalidatePath('/admin/crm')
  return lead
}

// ── INTERACCIONES ──────────────────────────────────────────────────────────

export async function logInteraction(data: {
  profileId?: string
  leadId?: string
  type: InteractionType
  summary: string
}) {
  const { userId } = await getAuthContext()

  const interaction = await prisma.interaction.create({
    data: { ...data, createdBy: userId },
  })

  revalidatePath('/admin/crm')
  return interaction
}

// Llamada interna desde el webhook (sin auth de usuario — usa service role)
export async function logIncomingWhatsApp(data: {
  from: string
  waId: string
  text: string
  contactName: string
}) {
  const normalized = normalizePhone(data.from)

  // Busca si es un perfil existente o un lead
  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { whatsappPhone: normalized },
        { whatsappPhone: data.from },
        { phone: normalized },
      ],
    },
    select: { id: true },
  })

  const lead = !profile
    ? await prisma.lead.findFirst({
        where: { OR: [{ whatsapp: normalized }, { phone: normalized }] },
        select: { id: true },
      })
    : null

  // Busca un admin para asignar como createdBy (service account)
  const admin = await prisma.profile.findFirst({
    where: { role: 'admin' },
    select: { id: true },
  })

  if (!admin) return

  await prisma.interaction.create({
    data: {
      profileId:  profile?.id,
      leadId:     lead?.id,
      type:       'whatsapp_received',
      summary:    `${data.contactName}: ${data.text}`,
      waMessageId: data.waId,
      waStatus:   'delivered',
      createdBy:  admin.id,
    },
  })
}

// ── WHATSAPP — Envío manual desde el panel ─────────────────────────────────

export async function sendWhatsAppToProfile(profileId: string, text: string) {
  const { userId } = await getAuthContext()

  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: profileId },
    select: { whatsappPhone: true, phone: true, fullName: true },
  })

  const phone = profile.whatsappPhone ?? profile.phone
  if (!phone) throw new Error('El perfil no tiene número de WhatsApp registrado')

  const result = await sendTextMessage({ to: phone, text })

  await prisma.interaction.create({
    data: {
      profileId,
      type:        'whatsapp_sent',
      summary:     text,
      waMessageId: result.messageId,
      waStatus:    result.success ? 'sent' : 'failed',
      createdBy:   userId,
    },
  })

  revalidatePath(`/admin/users/${profileId}`)
  return result
}

export async function sendWhatsAppToLead(leadId: string, text: string) {
  const { userId } = await getAuthContext()

  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    select: { whatsapp: true, phone: true, name: true },
  })

  const phone = lead.whatsapp ?? lead.phone
  const result = await sendTextMessage({ to: phone, text })

  await prisma.interaction.create({
    data: {
      leadId,
      type:        'whatsapp_sent',
      summary:     text,
      waMessageId: result.messageId,
      waStatus:    result.success ? 'sent' : 'failed',
      createdBy:   userId,
    },
  })

  revalidatePath('/admin/crm')
  return result
}

// ── AUTOMACIONES DE WHATSAPP ───────────────────────────────────────────────

export async function triggerBookingConfirmed(
  profileId: string,
  fecha: string,
  hora: string,
  recurso: string
) {
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: profileId },
    select: { whatsappPhone: true, phone: true, fullName: true },
  })

  const phone = profile.whatsappPhone ?? profile.phone
  if (!phone) return

  return sendBookingConfirmed(phone, profile.fullName, fecha, hora, recurso)
}

export async function triggerClassReminder(profileId: string, hora: string, academia: string) {
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: profileId },
    select: { whatsappPhone: true, phone: true, fullName: true },
  })

  const phone = profile.whatsappPhone ?? profile.phone
  if (!phone) return

  return sendClassReminder(phone, profile.fullName, hora, academia)
}

export async function triggerPaymentDue(
  profileId: string,
  fechaVencimiento: string,
  monto: string
) {
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: profileId },
    select: { whatsappPhone: true, phone: true, fullName: true },
  })

  const phone = profile.whatsappPhone ?? profile.phone
  if (!phone) return

  const linkPago = `${process.env.NEXT_PUBLIC_APP_URL}/player/bookings`
  return sendPaymentDue(phone, profile.fullName, fechaVencimiento, monto, linkPago)
}

export async function triggerWelcome(profileId: string, academia: string) {
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: profileId },
    select: { whatsappPhone: true, phone: true, fullName: true },
  })

  const phone = profile.whatsappPhone ?? profile.phone
  if (!phone) return

  const linkApp = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return sendWelcome(phone, profile.fullName, academia, linkApp)
}

// ── RETENCIÓN ──────────────────────────────────────────────────────────────

export async function getRetentionDashboard() {
  const scores = await prisma.retentionScore.findMany({
    include: {
      profile: {
        select: {
          id: true,
          fullName: true,
          whatsappPhone: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { score: 'asc' },
  })

  const grouped = {
    active:   scores.filter((s) => s.status === 'active'),
    at_risk:  scores.filter((s) => s.status === 'at_risk'),
    losing:   scores.filter((s) => s.status === 'losing'),
    churned:  scores.filter((s) => s.status === 'churned'),
  }

  return grouped
}

// Recalcula scores según asistencia — debe ejecutarse diariamente via cron
export async function recalculateRetentionScores() {
  const players = await prisma.profile.findMany({
    where: { role: 'player', isActive: true },
    select: {
      id: true,
      fullName: true,
      whatsappPhone: true,
      phone: true,
      retentionScore: true,
    },
  })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  for (const player of players) {
    // Última clase asistida
    const lastAttendance = await prisma.sessionAttendance.findFirst({
      where: { playerId: player.id, status: 'present' },
      orderBy: { recordedAt: 'desc' },
      select: { recordedAt: true },
    })

    // Clases asistidas este mes
    const classesThisMonth = await prisma.sessionAttendance.count({
      where: {
        playerId: player.id,
        status: 'present',
        recordedAt: { gte: monthStart },
      },
    })

    const lastClassAt = lastAttendance?.recordedAt ?? null
    const daysSinceLastClass = lastClassAt
      ? Math.floor((now.getTime() - lastClassAt.getTime()) / 86_400_000)
      : 999

    // Cálculo del score y status
    let score: number
    let status: 'active' | 'at_risk' | 'losing' | 'churned'

    if (daysSinceLastClass <= 7) {
      score = 100; status = 'active'
    } else if (daysSinceLastClass <= 14) {
      score = 65;  status = 'at_risk'
    } else if (daysSinceLastClass <= 30) {
      score = 30;  status = 'losing'
    } else {
      score = 0;   status = 'churned'
    }

    await prisma.retentionScore.upsert({
      where:  { profileId: player.id },
      create: { profileId: player.id, score, status, lastClassAt, classesThisMonth },
      update: { score, status, lastClassAt, classesThisMonth },
    })

    // Envía alerta por WhatsApp si está en riesgo y no se alertó en los últimos 7 días
    const existing = player.retentionScore
    const alertedRecently = existing?.alertSentAt
      ? (now.getTime() - existing.alertSentAt.getTime()) / 86_400_000 < 7
      : false

    if ((status === 'at_risk' || status === 'losing') && !alertedRecently) {
      const phone = player.whatsappPhone ?? player.phone
      if (phone) {
        const linkReserva = `${process.env.NEXT_PUBLIC_APP_URL}/player/bookings`
        await sendRetentionAlert(phone, player.fullName, daysSinceLastClass, linkReserva)

        await prisma.retentionScore.update({
          where:  { profileId: player.id },
          data: { alertSentAt: now },
        } as Parameters<typeof prisma.retentionScore.update>[0])
      }
    }
  }
}
