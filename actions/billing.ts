'use server'

import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'
import {
  createCheckoutSession,
  createBillingPortalSession,
  STRIPE_PRICES,
  type BillingPlan,
  type BillingModality,
} from '@/lib/stripe/client'
import { getQuotaSummary } from '@/lib/quota'
import { PLAN_LIMITS } from '@/lib/stripe/webhooks'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BillingStatus = {
  plan:          'starter' | 'pro' | 'enterprise'
  status:        'trialing' | 'active' | 'suspended' | 'cancelled'
  trialEndsAt:   string | null
  planExpiresAt: string | null
  planStartedAt: string | null
  stripeSubId:   string | null
  customerId:    string | null
  limits: {
    max_resources: number
    max_members:   number
    max_coaches:   number
  }
  usage: {
    resources: { current: number; limit: number; allowed: boolean }
    members:   { current: number; limit: number; allowed: boolean }
    coaches:   { current: number; limit: number; allowed: boolean }
  }
}

// ── Pricing display data (no Stripe dependency) ───────────────────────────────

export const PLAN_DISPLAY = {
  starter: {
    name:     'Starter',
    desc:     'Academias que inician',
    limits:   '1 – 3 espacios · 60 miembros · 2 coaches',
    prices: {
      monthly:   { usd: 99,   label: '$99/mes',              billing: 'Facturado mensualmente' },
      quarterly: { usd: 84,   label: '$84/mes · $252/trim',  billing: 'Facturado cada 3 meses' },
      deferred:  { usd: 90,   label: '$90/mes · $1,080/año', billing: 'Contrato anual · 12 cuotas · 18% EA' },
      annual:    { usd: 990,  label: '$990/año · $83/mes',   billing: '2 meses gratis · pago único' },
    },
    savings: {
      quarterly: '$180/año',
      deferred:  '$108/año',
      annual:    '$198/año',
    },
  },
  pro: {
    name:     'Pro',
    desc:     'Academias en crecimiento',
    limits:   '4 – 7 espacios · 250 miembros · 6 coaches',
    prices: {
      monthly:   { usd: 199,  label: '$199/mes',               billing: 'Facturado mensualmente' },
      quarterly: { usd: 169,  label: '$169/mes · $507/trim',   billing: 'Facturado cada 3 meses' },
      deferred:  { usd: 180,  label: '$180/mes · $2,160/año',  billing: 'Contrato anual · 12 cuotas · 18% EA' },
      annual:    { usd: 1990, label: '$1,990/año · $166/mes',  billing: '2 meses gratis · pago único' },
    },
    savings: {
      quarterly: '$360/año',
      deferred:  '$228/año',
      annual:    '$398/año',
    },
  },
  enterprise: {
    name:     'Club',
    desc:     'Clubs grandes y complejos deportivos',
    limits:   '8+ espacios · miembros ilimitados · coaches ilimitados',
    prices: {
      monthly:   { usd: 399,  label: '$399/mes',               billing: 'Facturado mensualmente' },
      quarterly: { usd: 339,  label: '$339/mes · $1,017/trim', billing: 'Facturado cada 3 meses' },
      deferred:  { usd: 361,  label: '$361/mes · $4,332/año',  billing: 'Contrato anual · 12 cuotas · 18% EA' },
      annual:    { usd: 3990, label: '$3,990/año · $333/mes',  billing: '2 meses gratis · pago único' },
    },
    savings: {
      quarterly: '$720/año',
      deferred:  '$456/año',
      annual:    '$798/año',
    },
  },
} as const

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getBillingStatus(): Promise<BillingStatus> {
  const { organizationId } = await requireRole(['admin'])
  const prisma = getPrisma()

  const org = await prisma.organization.findUniqueOrThrow({
    where:  { id: organizationId },
    select: {
      plan:          true,
      status:        true,
      trialEndsAt:   true,
      planExpiresAt: true,
      planStartedAt: true,
      stripeSubId:   true,
      stripeCustomerId: true,
      planLimits:    true,
    },
  })

  const usage = await getQuotaSummary(organizationId)

  const raw = org.planLimits as Record<string, number> | null
  const limits = {
    max_resources: raw?.max_resources ?? (PLAN_LIMITS[org.plan] as Record<string, number>)?.max_resources ?? 3,
    max_members:   raw?.max_members   ?? (PLAN_LIMITS[org.plan] as Record<string, number>)?.max_members   ?? 60,
    max_coaches:   raw?.max_coaches   ?? (PLAN_LIMITS[org.plan] as Record<string, number>)?.max_coaches   ?? 2,
  }

  return {
    plan:          org.plan as BillingStatus['plan'],
    status:        org.status as BillingStatus['status'],
    trialEndsAt:   org.trialEndsAt?.toISOString() ?? null,
    planExpiresAt: org.planExpiresAt?.toISOString() ?? null,
    planStartedAt: org.planStartedAt?.toISOString() ?? null,
    stripeSubId:   org.stripeSubId,
    customerId:    org.stripeCustomerId,
    limits,
    usage,
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createCheckoutSessionAction(
  plan:     BillingPlan,
  modality: BillingModality,
): Promise<{ error: string } | never> {
  const { organizationId } = await requireRole(['admin'])

  const priceId = STRIPE_PRICES[plan]?.[modality]
  if (!priceId) return { error: 'Plan o modalidad no configurados en Stripe.' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await createCheckoutSession(
    organizationId,
    priceId,
    `${appUrl}/admin/billing?success=true`,
    `${appUrl}/admin/billing?cancelled=true`,
  )

  redirect(session.url!)
}

export async function openBillingPortalAction(): Promise<{ error: string } | never> {
  const { organizationId } = await requireRole(['admin'])
  const prisma = getPrisma()

  const org = await prisma.organization.findUnique({
    where:  { id: organizationId },
    select: { stripeCustomerId: true },
  })

  if (!org?.stripeCustomerId) {
    return { error: 'No existe una suscripción activa para gestionar.' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const session = await createBillingPortalSession(
    org.stripeCustomerId,
    `${appUrl}/admin/billing`,
  )

  redirect(session.url)
}
