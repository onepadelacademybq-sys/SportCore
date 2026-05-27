'use client'

import { useActionState, useState } from 'react'
import { cancelBookingAction } from '@/actions/bookings'
import type { BookingState } from '@/actions/bookings'
import { Button } from '@/components/ui/button'

interface Props {
  bookingId: string
  slotLabel: 'AM' | 'PM' | 'FDS'
}

export function CancelMyBookingButton({ bookingId, slotLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, isPending] = useActionState(
    cancelBookingAction,
    { error: null } as BookingState,
  )

  if (state.success) {
    return (
      <p className="text-xs text-emerald-500 text-right">{state.success}</p>
    )
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 text-xs text-muted-foreground hover:text-destructive"
      >
        Cancelar clase
      </Button>
    )
  }

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2 text-xs">
      <p className="text-foreground">
        ¿Cancelar esta clase? El valor se acreditará a tu E-wallet como{' '}
        <strong>1 clase {slotLabel}</strong>.{' '}
        No aplica devolución en efectivo.
      </p>
      {state.error && (
        <p className="text-destructive">{state.error}</p>
      )}
      <form action={action} className="flex gap-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={isPending}
          className="h-7 text-xs"
        >
          {isPending ? 'Cancelando…' : 'Sí, cancelar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setOpen(false)}
        >
          Volver
        </Button>
      </form>
    </div>
  )
}
