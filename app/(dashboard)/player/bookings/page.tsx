import type { Metadata } from 'next'
import { getCoaches, getPlayerBookings } from '@/actions/bookings'
import type { Booking } from '@/actions/bookings'
import { getPlayerWallet, getWalletTransactions } from '@/actions/wallet'
import { BookingRequestForm } from '@/components/bookings/booking-request-form'
import { PaymentCard } from '@/components/bookings/payment-card'
import { PaymentProofForm } from '@/components/bookings/payment-proof-form'
import { BookingCountdown } from '@/components/bookings/booking-countdown'
import { CancelBookingButton } from '@/components/bookings/confirm-booking-form'
import { CancelMyBookingButton } from '@/components/bookings/cancel-my-booking-button'
import { StatusBadge } from '@/components/bookings/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatBookingDateTime } from '@/lib/format'
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'

type SlotLabel = 'AM' | 'PM' | 'FDS'

function getSlotLabel(startTime: string): SlotLabel {
  const d   = new Date(startTime)
  const day = d.getUTCDay()
  if (day === 0 || day === 6) return 'FDS'
  return d.getUTCHours() < 16 ? 'AM' : 'PM'
}

function canCancelWithCredit(b: Booking): boolean {
  if (!['confirmed', 'paid'].includes(b.status)) return false
  return (new Date(b.start_time).getTime() - Date.now()) >= 24 * 3_600_000
}

export const metadata: Metadata = { title: 'Mis Reservas' }

export default async function PlayerBookingsPage() {
  const [coaches, bookings, wallet, transactions] = await Promise.all([
    getCoaches(),
    getPlayerBookings(),
    getPlayerWallet(),
    getWalletTransactions(5),
  ])

  const active   = bookings.filter((b) => !['cancelled', 'completed'].includes(b.status))
  const archived = bookings.filter((b) => ['cancelled', 'completed'].includes(b.status))

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mis Reservas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Solicita clases con tu entrenador y gestiona tus reservas
        </p>
      </div>

      {/* E-wallet card */}
      <Card className="border-[#00C4CC]/30 bg-[#00C4CC]/5">
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#00C4CC]" />
              <span className="font-semibold">Mis clases</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#00C4CC]">{wallet.available_classes}</p>
              <p className="text-[10px] text-muted-foreground">
                {wallet.used_classes} usadas · {wallet.total_classes} totales
              </p>
            </div>
          </div>

          {wallet.available_classes === 0 && transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-1">
              Aún no tienes clases disponibles. Compra un paquete para empezar.
            </p>
          ) : (
            transactions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    Últimas transacciones
                  </p>
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        {t.type === 'credit'
                          ? <TrendingUp  className="h-3 w-3 text-emerald-500 shrink-0" />
                          : <TrendingDown className="h-3 w-3 text-red-400 shrink-0" />
                        }
                        <span className="text-muted-foreground">{t.description}</span>
                      </div>
                      <span className={`font-medium tabular-nums ${t.type === 'credit' ? 'text-emerald-500' : 'text-red-400'}`}>
                        {t.type === 'credit' ? '+' : '-'}{t.classes}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </CardContent>
      </Card>

      {/* Request form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitar nueva reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingRequestForm
            coaches={coaches}
            userRole="player"
            availableClasses={wallet?.available_classes ?? 0}
          />
        </CardContent>
      </Card>

      {/* Active bookings */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Reservas activas
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes reservas activas.</p>
        ) : (
          <div className="space-y-3">
            {active.map((b) => (
              <Card key={b.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {b.coach?.full_name ?? 'Entrenador no asignado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBookingDateTime(b.start_time, b.end_time)}
                      </p>
                      {b.court && (
                        <p className="text-xs text-muted-foreground">
                          Cancha: {b.court.name}
                        </p>
                      )}
                      {b.notes && (
                        <p className="text-xs text-muted-foreground italic">&ldquo;{b.notes}&rdquo;</p>
                      )}
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  {/* Datos de pago + subir comprobante — solo cuando está pendiente */}
                  {b.status === 'pending' && (
                    <>
                      <Separator />
                      {b.expires_at && <BookingCountdown expiresAt={b.expires_at} />}
                      <PaymentCard bookingId={b.id} price={b.price} />
                      <PaymentProofForm bookingId={b.id} />
                    </>
                  )}

                  {/* Comprobante ya enviado */}
                  {b.status === 'paid' && (
                    <>
                      <Separator />
                      <p className="text-xs text-muted-foreground">
                        Comprobante enviado · Pendiente de verificación por el administrador.
                      </p>
                    </>
                  )}

                  {/* Cancelar clase (pagada/confirmada) — con crédito wallet */}
                  {canCancelWithCredit(b) && (
                    <div className="flex justify-end pt-1">
                      <CancelMyBookingButton
                        bookingId={b.id}
                        slotLabel={getSlotLabel(b.start_time)}
                      />
                    </div>
                  )}

                  {/* Aviso de cancelación tardía para pagadas/confirmadas */}
                  {['confirmed', 'paid'].includes(b.status) && !canCancelWithCredit(b) && (
                    <p className="text-[10px] text-muted-foreground text-right">
                      Cancelación no disponible (menos de 24 h)
                    </p>
                  )}

                  {/* Cancelar reserva pendiente — sin crédito wallet */}
                  {b.status === 'pending' && (
                    <div className="flex justify-end">
                      <CancelBookingButton bookingId={b.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Archived bookings */}
      {archived.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Historial
          </h2>
          <div className="space-y-2">
            {archived.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-border text-sm"
              >
                <div>
                  <span className="font-medium">{b.coach?.full_name ?? '—'}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {formatBookingDateTime(b.start_time, b.end_time)}
                  </span>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
