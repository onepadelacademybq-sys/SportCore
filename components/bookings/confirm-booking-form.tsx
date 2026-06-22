'use client'

import { useActionState, useState } from 'react'
import { confirmBookingAction, cancelBookingAction } from '@/actions/bookings'
import type { BookingState, CourtOption } from '@/actions/bookings'
import { Button } from '@/components/ui/button'

const selectClass =
  'rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground ' +
  'focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50'

interface ConfirmProps {
  bookingId: string
  courts: CourtOption[]
}

export function ConfirmBookingForm({ bookingId, courts }: ConfirmProps) {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState(
    confirmBookingAction,
    { error: null } as BookingState,
  )

  if (state.success) return <span className="text-xs text-brand">✓ Confirmada</span>

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)} className="h-7 text-xs">
        Confirmar
      </Button>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-1.5 min-w-[180px]">
      <input type="hidden" name="bookingId" value={bookingId} />
      {courts.length > 0 && (
        <select name="courtId" className={selectClass}>
          <option value="">Sin asignar cancha</option>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex gap-1">
        <Button type="submit" size="sm" disabled={isPending} className="h-7 text-xs flex-1">
          {isPending ? '...' : 'Confirmar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setOpen(false)}
        >
          ✕
        </Button>
      </div>
    </form>
  )
}

interface CancelProps {
  bookingId: string
}

export function CancelBookingButton({ bookingId }: CancelProps) {
  const [state, action, isPending] = useActionState(
    cancelBookingAction,
    { error: null } as BookingState,
  )

  if (state.success) return <span className="text-xs text-muted-foreground">Cancelada</span>

  return (
    <form action={action}>
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="h-7 text-xs text-muted-foreground hover:text-destructive"
      >
        {isPending ? '...' : 'Cancelar'}
      </Button>
    </form>
  )
}
