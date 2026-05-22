import { NextResponse } from 'next/server'

// TODO: Verify Stripe signature with STRIPE_WEBHOOK_SECRET before processing
export async function POST() {
  return NextResponse.json({ received: true })
}
