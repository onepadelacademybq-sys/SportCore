'use client'

import { useActionState } from 'react'
import { confirmGroupPaymentAction } from '@/actions/groups'
import { CheckCircle } from 'lucide-react'

interface Props {
  memberId:   string
  playerName: string
}

export function ConfirmGroupPaymentButton({ memberId, playerName }: Props) {
  const [state, action, isPending] = useActionState(confirmGroupPaymentAction, { error: null })

  if (state.success) {
    return <span className="text-xs text-emerald-400 font-medium">{state.success}</span>
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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400
            hover:text-emerald-300 transition-colors disabled:opacity-50"
          onClick={(e) => {
            if (!confirm(`¿Confirmar pago de inscripción de ${playerName}?`)) e.preventDefault()
          }}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {isPending ? 'Confirmando…' : 'Confirmar pago'}
        </button>
      </form>
    </div>
  )
}
