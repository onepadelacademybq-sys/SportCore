'use client'

import { useActionState } from 'react'
import { recordPaymentAction } from '@/actions/groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GroupPaymentRecord } from '@/actions/groups'
import { PaymentStatusBadge } from './payment-status-badge'

interface Props {
  groupId: string
  payment: GroupPaymentRecord
  year: number
  month: number
}

export function RecordPaymentForm({ groupId, payment, year, month }: Props) {
  const [state, action, isPending] = useActionState(recordPaymentAction, { error: null })
  const amountDue = Number(payment.amount_due)

  return (
    <div className="space-y-1">
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-[#00C4CC]">{state.success}</p>
      )}

      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="groupId"     value={groupId} />
        <input type="hidden" name="playerId"    value={payment.player_id} />
        <input type="hidden" name="periodYear"  value={year} />
        <input type="hidden" name="periodMonth" value={month} />

        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {payment.player?.full_name ?? payment.player_id}
            </p>
            <PaymentStatusBadge status={payment.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            Debe: ${amountDue.toFixed(2)} · Pagado: ${Number(payment.amount_paid).toFixed(2)}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Input
            name="amountPaid"
            type="number"
            min={0}
            step="0.01"
            defaultValue={Number(payment.amount_paid)}
            disabled={isPending}
            className="w-24 h-8 text-sm"
          />
          <Button type="submit" size="sm" disabled={isPending} className="h-8 text-xs">
            {isPending ? '...' : 'Registrar'}
          </Button>
        </div>
      </form>
    </div>
  )
}
