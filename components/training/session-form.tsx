'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createSessionAction } from '@/actions/training'
import type { ConfirmedBooking } from '@/actions/training'

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatBookingLabel(b: ConfirmedBooking): string {
  const start = new Date(b.start_time)
  const end = new Date(b.end_time)
  const date = start.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
  const startT = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const endT = end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const court = b.court_name ? ` · ${b.court_name}` : ''
  return `${date} ${startT}–${endT}${court}`
}

interface Props {
  microcycleId:        string
  confirmedBookings?:  ConfirmedBooking[]
  hasPlayerAssignment?: boolean
}

export function SessionForm({
  microcycleId,
  confirmedBookings = [],
  hasPlayerAssignment = false,
}: Props) {
  const [state, formAction, isPending] = useActionState(createSessionAction, { error: null })

  const [scheduledAt, setScheduledAt] = useState('')
  const [durationMin, setDurationMin] = useState(60)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  function applyBooking(bookingId: string) {
    const booking = confirmedBookings.find((b) => b.id === bookingId)
    if (!booking) return
    setSelectedBookingId(bookingId)
    setScheduledAt(toDatetimeLocal(booking.start_time))
    const mins = Math.round(
      (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000,
    )
    setDurationMin(mins)
  }

  if (state.success) {
    return (
      <Alert className="border-brand/30 bg-brand/10">
        <AlertDescription className="text-brand">{state.success}</AlertDescription>
      </Alert>
    )
  }

  // Show the booking section when the mesocycle is assigned to a player
  // (even if there are no confirmed bookings, so we can show the empty-state message)
  // or when there are confirmed bookings from group assignments.
  const showBookingSection = hasPlayerAssignment || confirmedBookings.length > 0

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" name="microcycleId" value={microcycleId} />

      {/* Booking section */}
      {showBookingSection && (
        <div className="space-y-2">
          <Label>Vincular a reserva confirmada</Label>

          {confirmedBookings.length === 0 ? (
            <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 px-4 py-3 leading-relaxed">
              Este jugador no tiene reservas confirmadas. Crea una reserva primero desde el módulo de Reservas.
            </p>
          ) : (
            <>
              <div className="space-y-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2">
                {confirmedBookings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => applyBooking(b.id)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-md transition-colors ${
                      selectedBookingId === b.id
                        ? 'bg-primary/15 text-foreground border border-primary/30'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {formatBookingLabel(b)}
                  </button>
                ))}
              </div>
              {selectedBookingId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookingId(null)
                    setScheduledAt('')
                    setDurationMin(60)
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Quitar vinculación
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Fecha y hora</Label>
          <Input
            id="scheduledAt" name="scheduledAt" type="datetime-local"
            required disabled={isPending}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMin">Duración (min)</Label>
          <Input
            id="durationMin" name="durationMin" type="number"
            min={15} max={240} disabled={isPending}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coachNotes">Notas del entrenador (opcional)</Label>
        <Textarea id="coachNotes" name="coachNotes" rows={2} disabled={isPending} />
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Creando…' : 'Crear sesión'}
      </Button>
    </form>
  )
}
