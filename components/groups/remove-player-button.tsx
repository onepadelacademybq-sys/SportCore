'use client'

import { useActionState } from 'react'
import { removePlayerAction } from '@/actions/groups'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  memberId: string
  playerName: string
}

export function RemovePlayerButton({ memberId, playerName }: Props) {
  const [state, action, isPending] = useActionState(removePlayerAction, { error: null })

  return (
    <div>
      {state.error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <form action={action}>
        <input type="hidden" name="memberId" value={memberId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
          onClick={(e) => {
            if (!confirm(`¿Dar de baja a ${playerName}?`)) e.preventDefault()
          }}
        >
          {isPending ? '...' : 'Dar de baja'}
        </Button>
      </form>
    </div>
  )
}
