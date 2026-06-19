'use client'

import { useActionState, useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { requestPublicBooking } from '@/actions/public'
import type { TimeSlot, BookingRequestState } from '@/actions/public'

const INITIAL: BookingRequestState = { success: false, error: null }

interface Props {
  orgId:      string
  courtId:    string
  courtName:  string
  date:       string
  slots:      TimeSlot[]
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function BookingSlotForm({ orgId, courtId, courtName, date, slots }: Props) {
  const [state, formAction, pending] = useActionState(requestPublicBooking, INITIAL)
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)

  // Reset selection if date/court change
  useEffect(() => { setSelectedSlot(null) }, [courtId, date])

  if (state.success) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-3">
        <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
        <h3 className="text-lg font-semibold">¡Solicitud enviada!</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Tu solicitud de reserva fue recibida. El equipo de la academia te contactará para confirmar.
        </p>
      </div>
    )
  }

  const available = slots.filter((s) => s.available)

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden context */}
      <input type="hidden" name="org_id"    value={orgId} />
      <input type="hidden" name="court_id"  value={courtId} />
      <input type="hidden" name="date"      value={date} />
      {selectedSlot && (
        <>
          <input type="hidden" name="slot_start" value={selectedSlot.start} />
          <input type="hidden" name="slot_end"   value={selectedSlot.end} />
        </>
      )}

      {/* Slot picker */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <p className="font-semibold text-sm">{courtName}</p>
          <p className="text-xs text-muted-foreground capitalize">{formatDate(date)}</p>
        </div>

        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No hay horarios disponibles para esta fecha. Prueba otra fecha.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.start === slot.start
              return (
                <button
                  key={slot.start}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.available ? { start: slot.start, end: slot.end } : null)}
                  className={[
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    slot.available
                      ? isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-primary/10 hover:border-primary/50'
                      : 'opacity-35 cursor-not-allowed bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {slot.start}
                </button>
              )
            })}
          </div>
        )}

        {selectedSlot && (
          <p className="text-xs text-primary font-medium">
            Seleccionado: {selectedSlot.start} – {selectedSlot.end}
          </p>
        )}
      </div>

      {/* Contact form — shown once a slot is picked */}
      {selectedSlot && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm">Tus datos</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="guest_name" className="text-sm font-medium">
                Nombre completo <span className="text-red-400">*</span>
              </label>
              <input
                id="guest_name"
                name="guest_name"
                required
                autoComplete="name"
                placeholder="Tu nombre"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="guest_email" className="text-sm font-medium">
                Correo electrónico <span className="text-red-400">*</span>
              </label>
              <input
                id="guest_email"
                name="guest_email"
                type="email"
                required
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="guest_phone" className="text-sm font-medium">
                Teléfono
              </label>
              <input
                id="guest_phone"
                name="guest_phone"
                type="tel"
                autoComplete="tel"
                placeholder="+57 300 000 0000"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-sm font-medium">
                Notas (opcional)
              </label>
              <input
                id="notes"
                name="notes"
                placeholder="Nivel, preferencias…"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {state.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {pending ? 'Enviando solicitud…' : 'Solicitar reserva'}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Tu solicitud será revisada y confirmada por la academia.
          </p>
        </div>
      )}
    </form>
  )
}
