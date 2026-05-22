'use client'

import { useActionState } from 'react'
import { uploadPaymentProofAction } from '@/actions/bookings'
import type { BookingState } from '@/actions/bookings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  bookingId: string
}

export function PaymentProofForm({ bookingId }: Props) {
  const [state, action, isPending] = useActionState(
    uploadPaymentProofAction,
    { error: null } as BookingState,
  )

  if (state.success) {
    return (
      <p className="text-xs text-[#00C4CC]">{state.success}</p>
    )
  }

  return (
    <form action={action} className="space-y-2 mt-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2">
        <Input
          name="paymentProofUrl"
          type="url"
          placeholder="https://... (URL del comprobante)"
          required
          disabled={isPending}
          className="text-xs h-8"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </form>
  )
}
