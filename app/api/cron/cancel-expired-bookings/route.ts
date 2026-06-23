import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/actions/notifications'

// Vercel Cron invoca con Authorization: Bearer <CRON_SECRET>
// En dev puede llamarse manualmente: GET /api/cron/cancel-expired-bookings?secret=<CRON_SECRET>
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    const querySecret = req.nextUrl.searchParams.get('secret')
    const provided = authHeader?.replace('Bearer ', '') ?? querySecret ?? ''
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const now   = new Date().toISOString()

  // 1. Fetch expired pending bookings with player info before cancelling
  const { data: expired, error: fetchError } = await admin
    .from('bookings')
    .select('id, player_id, start_time, court:courts!court_id(name)')
    .eq('status', 'pending')
    .not('expires_at', 'is', null)
    .lt('expires_at', now)

  if (fetchError) {
    console.error('[cron/cancel-expired] fetch error:', fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ cancelled: 0 })
  }

  const ids = expired.map((b) => b.id)

  // 2. Cancel all in one update
  const { error: updateError } = await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .in('id', ids)

  if (updateError) {
    console.error('[cron/cancel-expired] update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 3. Notify each affected player (fire-and-forget, don't block response)
  await Promise.allSettled(
    (expired as any[])
      .filter((b) => b.player_id)
      .map((b) => {
        const date = new Date(b.start_time).toLocaleDateString('es-CO', {
          weekday: 'long', day: 'numeric', month: 'long',
          timeZone: 'America/Bogota',
        })
        const courtName = (b.court as { name: string } | null)?.name
        const body = courtName
          ? `Tu reserva del ${date} en ${courtName} fue cancelada por falta de pago.`
          : `Tu reserva del ${date} fue cancelada por falta de pago.`

        return createNotification(
          b.player_id,
          'Reserva cancelada por vencimiento',
          body,
          'booking_cancelled',
          '/player/bookings',
        )
      })
  )

  console.log(`[cron/cancel-expired] cancelled ${ids.length} bookings`)
  return NextResponse.json({ cancelled: ids.length, ids })
}
