import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getAllBookings } from '@/actions/bookings'
import { getCourts } from '@/actions/bookings'
import { ConfirmBookingForm, CancelBookingButton } from '@/components/bookings/confirm-booking-form'
import { ConfirmGroupSessionButton } from '@/components/bookings/confirm-group-session-button'
import { StatusBadge } from '@/components/bookings/status-badge'
import { ViewProofButton } from '@/components/bookings/view-proof-button'
import { BookingsFilters } from '@/components/bookings/bookings-filters'
import { BookingsPagination } from '@/components/bookings/bookings-pagination'
import { formatBookingDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Reservas — Admin' }

const FILTERS = [
  { label: 'Todas',       value: 'all' },
  { label: 'Solicitadas', value: 'pending' },
  { label: 'Pagadas',     value: 'paid' },
  { label: 'Confirmadas', value: 'confirmed' },
  { label: 'Canceladas',  value: 'cancelled' },
  { label: 'Completadas', value: 'completed' },
]

interface Props {
  searchParams: Promise<{ status?: string; q?: string; date?: string; page?: string }>
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const sp           = await searchParams
  const activeFilter = FILTERS.find((f) => f.value === sp.status)?.value ?? 'all'
  const page         = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const [{ bookings, total, totalPages, pageSize }, courts] = await Promise.all([
    getAllBookings({
      status: activeFilter === 'all' ? undefined : activeFilter,
      q:      sp.q?.trim()  || undefined,
      date:   sp.date       || undefined,
      page,
    }),
    getCourts(),
  ])

  function statusHref(value: string) {
    const next = new URLSearchParams()
    if (value !== 'all') next.set('status', value)
    if (sp.q)    next.set('q', sp.q)
    if (sp.date) next.set('date', sp.date)
    const qs = next.toString()
    return `/admin/bookings${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reservas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona todas las solicitudes de reserva de la academia
        </p>
      </div>

      {/* Search + date filter */}
      <Suspense>
        <BookingsFilters />
      </Suspense>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={statusHref(f.value)}
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
          No hay reservas con estos filtros.
        </p>
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-x-auto">
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
                        {b.group ? (
                          <>
                            <p className="font-medium">{b.group.name}</p>
                            <p className="text-xs text-muted-foreground">Clase grupal</p>
                          </>
                        ) : b.notes?.startsWith('[Reserva pública]') ? (
                          <>
                            <p className="font-medium">
                              {b.notes.replace('[Reserva pública] ', '').split(' · ')[0]}
                            </p>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                              Reserva pública
                            </span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {b.notes.replace('[Reserva pública] ', '').split(' · ').slice(1).join(' · ')}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{b.player?.full_name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{b.player?.email ?? ''}</p>
                          </>
                        )}
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
                        {b.status === 'cancelled' && b.wallet_credit_slot && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                            Crédito wallet {(b.wallet_credit_slot as string).toUpperCase()}
                          </span>
                        )}
                        {b.status === 'paid' && b.payment_proof_url && (
                          <ViewProofButton bookingId={b.id} storagePath={b.payment_proof_url} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(b.status === 'paid' || (b.status === 'pending' && !b.player && !b.group_id && b.notes?.startsWith('[Reserva pública]'))) && !b.group_id && (
                          <ConfirmBookingForm bookingId={b.id} courts={courts} />
                        )}
                        {b.status === 'pending' && b.group_id && (
                          <ConfirmGroupSessionButton sessionId={b.id} />
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

          <Suspense>
            <BookingsPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
            />
          </Suspense>
        </>
      )}
    </div>
  )
}
