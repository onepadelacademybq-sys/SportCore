import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY no está configurada')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-05-27.dahlia',
      typescript: true,
    })
  }
  return _stripe
}

export const STRIPE_PRICES: Record<string, string> = {
  starter_monthly:    process.env.STRIPE_PRICE_STARTER_MONTHLY    ?? '',
  pro_monthly:        process.env.STRIPE_PRICE_PRO_MONTHLY        ?? '',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '',
}

export async function getOrCreateStripeCustomer(orgId: string, email: string, name: string) {
  const stripe = getStripe()
  const { getPrisma } = await import('@/lib/prisma')
  const prisma = getPrisma()

  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })

  if (org.stripeCustomerId) {
    return stripe.customers.retrieve(org.stripeCustomerId) as Promise<Stripe.Customer>
  }

  const customer = await stripe.customers.create({ email, name, metadata: { orgId } })

  await prisma.organization.update({
    where:  { id: orgId },
    data:   { stripeCustomerId: customer.id },
  })

  return customer
}

export async function createCheckoutSession(orgId: string, priceId: string, successUrl: string, cancelUrl: string) {
  const stripe = getStripe()
  const { getPrisma } = await import('@/lib/prisma')
  const prisma = getPrisma()

  const org = await prisma.organization.findUniqueOrThrow({
    where:   { id: orgId },
    include: { profiles: { where: { role: 'admin' }, take: 1, select: { email: true, fullName: true } } },
  })

  const admin = org.profiles[0]
  const customer = await getOrCreateStripeCustomer(orgId, admin?.email ?? '', org.name)

  return stripe.checkout.sessions.create({
    customer:    (customer as Stripe.Customer).id,
    mode:        'subscription',
    line_items:  [{ price: priceId, quantity: 1 }],
    metadata:    { orgId },
    success_url: successUrl,
    cancel_url:  cancelUrl,
    subscription_data: { metadata: { orgId } },
  })
}

export async function createBillingPortalSession(stripeCustomerId: string, returnUrl: string) {
  return getStripe().billingPortal.sessions.create({
    customer:   stripeCustomerId,
    return_url: returnUrl,
  })
}
