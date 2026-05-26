'use client'

import { useActionState } from 'react'
import { cancelMyEnrollmentAction } from '@/actions/groups'

interface Props {
  memberId: string
  groupName: string
}

export function CancelEnrollmentButton({ memberId, groupName }: Props) {
  const [state, action, isPending] = useActionState(cancelMyEnrollmentAction, { error: null })

  return (
    <div className="text-right">
      {state.error && (
        <p className="text-xs text-destructive mb-1">{state.error}</p>
      )}
      <form action={action}>
        <input type="hidden" name="memberId" value={memberId} />
        <button
          type="submit"
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 underline-offset-2 hover:underline"
          onClick={(e) => {
            if (!confirm(`¿Estás seguro? Perderás tu cupo en "${groupName}".`)) e.preventDefault()
          }}
        >
          {isPending ? 'Cancelando…' : 'Cancelar inscripción'}
        </button>
      </form>
    </div>
  )
}
