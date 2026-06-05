import Stripe from 'stripe'
import { stripe } from './client'

export async function constructStripeEvent(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET no configurado')

  return stripe.webhooks.constructEventAsync(body, signature, secret)
}

// Mapeo de price IDs de Stripe a planes internos
export function planFromPriceId(priceId: string): 'starter' | 'pro' | 'enterprise' {
  const map: Record<string, 'starter' | 'pro' | 'enterprise'> = {
    [process.env.STRIPE_PRICE_STARTER_MONTHLY    ?? '__starter__']:    'starter',
    [process.env.STRIPE_PRICE_PRO_MONTHLY        ?? '__pro__']:        'pro',
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? '__enterprise__']: 'enterprise',
  }
  return map[priceId] ?? 'starter'
}

export const PLAN_LIMITS: Record<string, object> = {
  starter:    { max_resources: 6,  max_members: 100, max_coaches: 3 },
  pro:        { max_resources: 15, max_members: 300, max_coaches: 8 },
  enterprise: { max_resources: 99, max_members: 999, max_coaches: 99 },
}
