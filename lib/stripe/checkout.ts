import { getStripe } from './client'

/**
 * Crea una Stripe Checkout Session para el pago de una reserva individual.
 * mode: 'payment' (cobro único, no suscripción).
 * El webhook checkout.session.completed con metadata.payment_type = 'booking'
 * confirma la reserva automáticamente.
 */
export async function createBookingCheckoutSession(
  bookingId:   string,
  amountCOP:   number,
  playerEmail: string,
  description: string,
): Promise<string> {
  const stripe  = getStripe()
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sportcore.app'

  const session = await stripe.checkout.sessions.create({
    mode:       'payment',
    currency:   'cop',
    line_items: [
      {
        price_data: {
          currency:     'cop',
          unit_amount:  amountCOP * 100,   // Stripe usa centavos para COP
          product_data: { name: description },
        },
        quantity: 1,
      },
    ],
    customer_email: playerEmail,
    metadata:       { booking_id: bookingId, payment_type: 'booking' },
    payment_intent_data: {
      metadata: { booking_id: bookingId, payment_type: 'booking' },
    },
    success_url: `${appUrl}/player/bookings?payment=success`,
    cancel_url:  `${appUrl}/player/bookings?payment=cancelled`,
    // Stripe mínimo 30 min — coherente con expires_at de la reserva en modo Stripe
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  })

  if (!session.url) throw new Error('Stripe no devolvió URL de checkout')
  return session.url
}
