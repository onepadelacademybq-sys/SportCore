import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no está configurada')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
  typescript: true,
})

// Planes de precios — IDs de Stripe (configurar en el dashboard de Stripe)
export const STRIPE_PRICES: Record<string, string> = {
  starter_monthly:    process.env.STRIPE_PRICE_STARTER_MONTHLY    ?? '',
  pro_monthly:        process.env.STRIPE_PRICE_PRO_MONTHLY        ?? '',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '',
}

// Crea o recupera un customer de Stripe para una organización
export async function getOrCreateStripeCustomer(orgId: string, email: string, name: string) {
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

// Crea sesión de checkout para suscripción
export async function createCheckoutSession(orgId: string, priceId: string, successUrl: string, cancelUrl: string) {
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

// Crea portal de facturación para que el cliente gestione su suscripción
export async function createBillingPortalSession(stripeCustomerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer:   stripeCustomerId,
    return_url: returnUrl,
  })
}
