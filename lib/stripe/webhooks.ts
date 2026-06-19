import Stripe from 'stripe'
import { getStripe, STRIPE_PRICES } from './client'

export async function constructStripeEvent(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET no configurado')

  return getStripe().webhooks.constructEventAsync(body, signature, secret)
}

// Mapeo de price IDs de Stripe a planes internos (todas las modalidades)
export function planFromPriceId(priceId: string): 'starter' | 'pro' | 'enterprise' {
  for (const [plan, prices] of Object.entries(STRIPE_PRICES) as [string, Record<string, string>][]) {
    if (Object.values(prices).includes(priceId)) {
      return plan as 'starter' | 'pro' | 'enterprise'
    }
  }
  return 'starter'
}

export const PLAN_LIMITS: Record<string, object> = {
  starter:    { max_resources: 3,  max_members: 60,  max_coaches: 2 },
  pro:        { max_resources: 7,  max_members: 250, max_coaches: 6 },
  enterprise: { max_resources: 99, max_members: 999, max_coaches: 99 },
}
