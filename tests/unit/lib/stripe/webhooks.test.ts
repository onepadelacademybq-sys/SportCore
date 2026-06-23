import { describe, it, expect, vi } from 'vitest'

// Mock del módulo client antes de importar webhooks.
// STRIPE_PRICES lee env vars en tiempo de módulo; lo mockeamos con IDs conocidos.
vi.mock('@/lib/stripe/client', () => ({
  STRIPE_PRICES: {
    starter:    { monthly: 'price_starter_m', quarterly: 'price_starter_q', deferred: 'price_starter_d', annual: 'price_starter_a' },
    pro:        { monthly: 'price_pro_m',     quarterly: 'price_pro_q',     deferred: 'price_pro_d',     annual: 'price_pro_a'     },
    enterprise: { monthly: 'price_ent_m',     quarterly: 'price_ent_q',     deferred: 'price_ent_d',     annual: 'price_ent_a'     },
  },
}))

import { planFromPriceId } from '@/lib/stripe/webhooks'

describe('planFromPriceId', () => {
  it('identifica plan starter por cualquier modalidad', () => {
    expect(planFromPriceId('price_starter_m')).toBe('starter')
    expect(planFromPriceId('price_starter_q')).toBe('starter')
    expect(planFromPriceId('price_starter_a')).toBe('starter')
  })

  it('identifica plan pro', () => {
    expect(planFromPriceId('price_pro_m')).toBe('pro')
    expect(planFromPriceId('price_pro_d')).toBe('pro')
  })

  it('identifica plan enterprise', () => {
    expect(planFromPriceId('price_ent_m')).toBe('enterprise')
    expect(planFromPriceId('price_ent_a')).toBe('enterprise')
  })

  it('devuelve starter como fallback para IDs desconocidos', () => {
    expect(planFromPriceId('price_inexistente')).toBe('starter')
    expect(planFromPriceId('')).toBe('starter')
  })
})
