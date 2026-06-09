import type { Metadata } from 'next'
import { getCoachBookings } from '@/actions/bookings'
import { StatusBadge } from '@/components/bookings/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatBookingDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Mis Clases' }

export default async function CoachBookingsPage() {
  const bookings = await getCoachBookings()

  const upcoming  = bookings.filter((b) => b.status === 'confirmed')
  const completed = bookings.filter((b) => b.status === 'completed')

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mis Clases</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tus sesiones confirmadas y el historial de clases impartidas
        </p>
      </div>

      {/* Upcoming */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Próximas sesiones
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes sesiones próximas confirmadas.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => (
              <Card key={b.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {b.player?.full_name ?? 'Jugador no asignado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.player?.email ?? ''}
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Historial
          </h2>
          <div className="space-y-2">
            {completed.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-border text-sm"
              >
                <div>
                  <span className="font-medium">{b.player?.full_name ?? '—'}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {formatBookingDateTime(b.start_time, b.end_time)}
                  </span>
                  {b.court && (
                    <span className="text-muted-foreground ml-2 text-xs">· {b.court.name}</span>
                  )}
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
