'use client'

import { useActionState } from 'react'
import { rejectGroupPaymentAction } from '@/actions/groups'
import { XCircle } from 'lucide-react'

interface Props {
  memberId:   string
  playerName: string
}

export function RejectGroupPaymentButton({ memberId, playerName }: Props) {
  const [state, action, isPending] = useActionState(rejectGroupPaymentAction, { error: null })

  if (state.success) {
    return <span className="text-xs text-amber-400 font-medium">{state.success}</span>
  }

  return (
    <div>
      {state.error && (
        <p className="text-xs text-destructive mb-1">{state.error}</p>
      )}
      <form action={action}>
        <input type="hidden" name="memberId" value={memberId} />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400
            hover:text-red-300 transition-colors disabled:opacity-50"
          onClick={(e) => {
            if (!confirm(`¿Rechazar comprobante de ${playerName}? El jugador deberá enviar uno nuevo.`)) e.preventDefault()
          }}
        >
          <XCircle className="h-3.5 w-3.5" />
          {isPending ? 'Rechazando…' : 'Rechazar'}
        </button>
      </form>
    </div>
  )
}
