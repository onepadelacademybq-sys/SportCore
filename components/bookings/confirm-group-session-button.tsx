'use client'

import { useActionState } from 'react'
import { confirmGroupSessionAction } from '@/actions/groups'
import { Button } from '@/components/ui/button'

interface Props {
  sessionId: string
}

export function ConfirmGroupSessionButton({ sessionId }: Props) {
  const [state, action, isPending] = useActionState(confirmGroupSessionAction, { error: null })

  if (state.success) return <span className="text-xs text-[#00C4CC]">✓ Confirmada</span>

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="sessionId" value={sessionId} />
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={isPending} className="h-7 text-xs">
        {isPending ? '...' : 'Confirmar reserva'}
      </Button>
    </form>
  )
}
