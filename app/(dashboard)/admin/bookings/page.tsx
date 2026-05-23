import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllBookings, getCourts } from '@/actions/bookings'
import { ConfirmBookingForm } from '@/components/bookings/confirm-booking-form'
import { CancelBookingButton } from '@/components/bookings/confirm-booking-form'
import { StatusBadge } from '@/components/bookings/status-badge'
import { ViewProofButton } from '@/components/bookings/view-proof-button'
import { formatBookingDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Reservas — Admin' }

const FILTERS = [
  { label: 'Todas',      value: 'all' },
  { label: 'Solicitadas', value: 'pending' },
  { label: 'Pagadas',    value: 'paid' },
  { label: 'Confirmadas', value: 'confirmed' },
  { label: 'Canceladas', value: 'cancelled' },
  { label: 'Completadas', value: 'completed' },
]

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const activeFilter = FILTERS.find((f) => f.value === status)?.value ?? 'all'

  const [bookings, courts] = await Promise.all([
    getAllBookings(activeFilter === 'all' ? undefined : activeFilter),
    getCourts(),
  ])

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reservas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona todas las solicitudes de reserva de la academia
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === 'all' ? '/admin/bookings' : `/admin/bookings?status=${f.value}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No hay reservas con este estado.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Jugador
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Entrenador
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fecha y hora
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{b.player?.full_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{b.player?.email ?? ''}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.coach?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatBookingDateTime(b.start_time, b.end_time)}
                    {b.court && (
                      <p className="text-xs text-muted-foreground/70">{b.court.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <StatusBadge status={b.status} />
                      {b.status === 'paid' && b.payment_proof_url && (
                        <ViewProofButton
                          bookingId={b.id}
                          storagePath={b.payment_proof_url}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {b.status === 'paid' && (
                        <ConfirmBookingForm bookingId={b.id} courts={courts} />
                      )}
                      {!['cancelled', 'completed'].includes(b.status) && (
                        <CancelBookingButton bookingId={b.id} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
