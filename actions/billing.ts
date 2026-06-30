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
