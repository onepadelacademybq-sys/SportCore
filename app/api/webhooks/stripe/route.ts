import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { constructStripeEvent, planFromPriceId, PLAN_LIMITS } from '@/lib/stripe/webhooks'
import { getPrisma } from '@/lib/prisma'
import { sendSubscriptionActivated, sendPaymentFailed, sendTrialEnding } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await constructStripeEvent(body, signature)
  } catch (err) {
    console.error('[Stripe webhook] Firma inválida:', err)
    return new NextResponse('Webhook signature verification failed', { status: 400 })
  }

  const prisma = getPrisma()

  try {
    switch (event.type) {

      // ── Checkout completado → activar suscripción ──────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const orgId  = session.metadata?.orgId
        const subId  = session.subscription as string
        if (!orgId) break

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub     = await import('@/lib/stripe/client').then(m => m.getStripe().subscriptions.retrieve(subId)) as any
        const priceId = sub.items.data[0]?.price.id ?? ''
        const plan    = planFromPriceId(priceId)

        await prisma.organization.update({
          where: { id: orgId },
          data:  {
            stripeSubId:   subId,
            plan:          plan as 'starter' | 'pro' | 'enterprise',
            status:        'active',
            planLimits:    PLAN_LIMITS[plan],
            planStartedAt: new Date(sub.current_period_start * 1000),
            planExpiresAt: new Date(sub.current_period_end   * 1000),
          },
        })

        // Email de bienvenida al admin
        const admin = await prisma.profile.findFirst({
          where:  { organizationId: orgId, role: 'admin' },
          select: { email: true, fullName: true },
        })
        if (admin) {
          await sendSubscriptionActivated(admin.email, admin.fullName, plan)
        }
        break
      }

      // ── Suscripción actualizada (upgrade, downgrade, renovación) ───────
      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub   = event.data.object as any
        const orgId = sub.metadata?.orgId
        if (!orgId) break

        const priceId = sub.items.data[0]?.price.id ?? ''
        const plan    = planFromPriceId(priceId)
        const status  = sub.status === 'active' ? 'active'
                      : sub.status === 'trialing' ? 'trialing'
                      : sub.status === 'past_due'  ? 'suspended'
                      : 'suspended'

        await prisma.organization.update({
          where: { id: orgId },
          data:  {
            plan:          plan as 'starter' | 'pro' | 'enterprise',
            status:        status as 'active' | 'trialing' | 'suspended',
            planLimits:    PLAN_LIMITS[plan],
            planStartedAt: new Date(sub.current_period_start * 1000),
            planExpiresAt: new Date(sub.current_period_end   * 1000),
          },
        })
        break
      }

      // ── Suscripción cancelada ──────────────────────────────────────────
      case 'customer.subscription.deleted': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub   = event.data.object as any
        const orgId = sub.metadata?.orgId
        if (!orgId) break

        await prisma.organization.update({
          where: { id: orgId },
          data:  { status: 'cancelled', stripeSubId: null },
        })
        break
      }

      // ── Pago fallido ───────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const orgId   = invoice.subscription_details?.metadata?.orgId
                     ?? invoice.metadata?.orgId
        if (!orgId) break

        await prisma.organization.update({
          where: { id: orgId },
          data:  { status: 'suspended' },
        })

        const admin = await prisma.profile.findFirst({
          where:  { organizationId: orgId, role: 'admin' },
          select: { email: true, fullName: true },
        })
        if (admin) {
          await sendPaymentFailed(admin.email, admin.fullName)
        }
        break
      }

      // ── Trial terminando en 3 días ─────────────────────────────────────
      case 'customer.subscription.trial_will_end': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub   = event.data.object as any
        const orgId = sub.metadata?.orgId
        if (!orgId) break

        const admin = await prisma.profile.findFirst({
          where:  { organizationId: orgId, role: 'admin' },
          select: { email: true, fullName: true },
        })
        if (admin) {
          await sendTrialEnding(admin.email, admin.fullName)
        }
        break
      }
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error procesando ${event.type}:`, err)
    return new NextResponse('Internal error', { status: 500 })
  }

  return new NextResponse('OK', { status: 200 })
}
