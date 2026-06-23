/**
 * Crea los 12 productos + precios de SportCore en Stripe (modo test).
 * Actualiza automáticamente las variables STRIPE_PRICE_* en .env.local.
 *
 * Uso:
 *   npx tsx scripts/stripe-setup-test.ts
 *
 * Requiere STRIPE_SECRET_KEY=sk_test_... en .env.local
 */

import Stripe from 'stripe'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? ''
if (!SECRET_KEY.startsWith('sk_test_')) {
  console.error('❌  STRIPE_SECRET_KEY debe ser una clave de MODO TEST (sk_test_...).')
  console.error('   Obtén tu clave en: https://dashboard.stripe.com/test/apikeys')
  process.exit(1)
}

const stripe = new Stripe(SECRET_KEY, { apiVersion: '2026-05-27.dahlia', typescript: true })

// ─── Definición de planes ─────────────────────────────────────────────────────

type Plan      = 'starter' | 'pro' | 'enterprise'
type Modality  = 'monthly' | 'quarterly' | 'deferred' | 'annual'

interface PriceSpec {
  /** Monto en centavos USD */
  amount:        number
  interval:      Stripe.PriceCreateParams.Recurring.Interval
  intervalCount: number
  nickname:      string
}

const PLANS: Record<Plan, { name: string; prices: Record<Modality, PriceSpec> }> = {
  starter: {
    name: 'SportCore Starter',
    prices: {
      monthly:   { amount: 9900,   interval: 'month', intervalCount: 1,  nickname: 'Starter · Mensual' },
      quarterly: { amount: 25200,  interval: 'month', intervalCount: 3,  nickname: 'Starter · Trimestral ($84/mes)' },
      deferred:  { amount: 9000,   interval: 'month', intervalCount: 1,  nickname: 'Starter · Cuota anual ($90/mes)' },
      annual:    { amount: 99000,  interval: 'year',  intervalCount: 1,  nickname: 'Starter · Anual ($990/año)' },
    },
  },
  pro: {
    name: 'SportCore Pro',
    prices: {
      monthly:   { amount: 19900,  interval: 'month', intervalCount: 1,  nickname: 'Pro · Mensual' },
      quarterly: { amount: 50700,  interval: 'month', intervalCount: 3,  nickname: 'Pro · Trimestral ($169/mes)' },
      deferred:  { amount: 18000,  interval: 'month', intervalCount: 1,  nickname: 'Pro · Cuota anual ($180/mes)' },
      annual:    { amount: 199000, interval: 'year',  intervalCount: 1,  nickname: 'Pro · Anual ($1,990/año)' },
    },
  },
  enterprise: {
    name: 'SportCore Club',
    prices: {
      monthly:   { amount: 39900,  interval: 'month', intervalCount: 1,  nickname: 'Club · Mensual' },
      quarterly: { amount: 101700, interval: 'month', intervalCount: 3,  nickname: 'Club · Trimestral ($339/mes)' },
      deferred:  { amount: 36100,  interval: 'month', intervalCount: 1,  nickname: 'Club · Cuota anual ($361/mes)' },
      annual:    { amount: 399000, interval: 'year',  intervalCount: 1,  nickname: 'Club · Anual ($3,990/año)' },
    },
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ENV_KEY: Record<Plan, Record<Modality, string>> = {
  starter:    { monthly: 'STRIPE_PRICE_STARTER_MONTHLY',  quarterly: 'STRIPE_PRICE_STARTER_QUARTERLY',  deferred: 'STRIPE_PRICE_STARTER_DEFERRED',  annual: 'STRIPE_PRICE_STARTER_ANNUAL'  },
  pro:        { monthly: 'STRIPE_PRICE_PRO_MONTHLY',      quarterly: 'STRIPE_PRICE_PRO_QUARTERLY',      deferred: 'STRIPE_PRICE_PRO_DEFERRED',      annual: 'STRIPE_PRICE_PRO_ANNUAL'      },
  enterprise: { monthly: 'STRIPE_PRICE_CLUB_MONTHLY',     quarterly: 'STRIPE_PRICE_CLUB_QUARTERLY',     deferred: 'STRIPE_PRICE_CLUB_DEFERRED',     annual: 'STRIPE_PRICE_CLUB_ANNUAL'     },
}

async function getOrCreateProduct(plan: Plan): Promise<string> {
  const metaKey = `sportcore_plan_${plan}`

  // Search by metadata to avoid duplicates on re-runs
  const existing = await stripe.products.search({
    query: `metadata['sportcore_plan']:'${plan}' AND active:'true'`,
  })

  if (existing.data.length > 0) {
    console.log(`  ♻  Producto existente: ${existing.data[0].name} (${existing.data[0].id})`)
    return existing.data[0].id
  }

  const product = await stripe.products.create({
    name:     PLANS[plan].name,
    metadata: { sportcore_plan: plan },
  })
  console.log(`  ✓  Producto creado: ${product.name} (${product.id})`)
  return product.id
}

async function getOrCreatePrice(productId: string, plan: Plan, modality: Modality): Promise<string> {
  const spec = PLANS[plan].prices[modality]

  // Search by metadata to avoid duplicates
  const existing = await stripe.prices.search({
    query: `metadata['sportcore_plan']:'${plan}' AND metadata['sportcore_modality']:'${modality}' AND active:'true'`,
  })

  if (existing.data.length > 0) {
    console.log(`    ♻  Precio existente: ${existing.data[0].nickname} (${existing.data[0].id})`)
    return existing.data[0].id
  }

  const price = await stripe.prices.create({
    product:        productId,
    currency:       'usd',
    unit_amount:    spec.amount,
    nickname:       spec.nickname,
    recurring: {
      interval:       spec.interval,
      interval_count: spec.intervalCount,
    },
    metadata: {
      sportcore_plan:     plan,
      sportcore_modality: modality,
    },
  })
  console.log(`    ✓  Precio creado: ${spec.nickname} (${price.id})`)
  return price.id
}

function updateEnvFile(updates: Record<string, string>): void {
  const envPath = path.resolve(process.cwd(), '.env.local')
  let content   = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

  for (const [key, value] of Object.entries(updates)) {
    const line   = `${key}=${value}`
    const regex  = new RegExp(`^${key}=.*$`, 'm')
    if (regex.test(content)) {
      content = content.replace(regex, line)
    } else {
      content += `\n${line}`
    }
  }

  fs.writeFileSync(envPath, content)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀  SportCore — Setup de precios Stripe (modo test)\n')

  const results: Record<string, string> = {}

  for (const plan of ['starter', 'pro', 'enterprise'] as Plan[]) {
    console.log(`\n📦  ${PLANS[plan].name}`)
    const productId = await getOrCreateProduct(plan)

    for (const modality of ['monthly', 'quarterly', 'deferred', 'annual'] as Modality[]) {
      const priceId = await getOrCreatePrice(productId, plan, modality)
      const envKey  = ENV_KEY[plan][modality]
      results[envKey] = priceId
    }
  }

  // Write to .env.local
  updateEnvFile(results)

  console.log('\n✅  .env.local actualizado con los 12 Price IDs:\n')
  for (const [key, val] of Object.entries(results)) {
    console.log(`   ${key}=${val}`)
  }

  console.log('\n📡  Siguiente paso — reenviar webhooks en local:')
  console.log('   brew install stripe/stripe-cli/stripe')
  console.log('   stripe login')
  console.log(`   stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
  console.log('   Copia el webhook signing secret → STRIPE_WEBHOOK_SECRET en .env.local\n')
}

main().catch((err) => {
  console.error('❌  Error:', err.message)
  process.exit(1)
})
