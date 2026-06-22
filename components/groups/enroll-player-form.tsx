'use client'

import { useActionState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { enrollPlayerAction } from '@/actions/groups'

const selectClass =
  'flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

interface Player {
  id: string
  full_name: string
  email: string
}

interface Props {
  groupId: string
  players: Player[]
}

export function EnrollPlayerForm({ groupId, players }: Props) {
  const [state, action, isPending] = useActionState(enrollPlayerAction, { error: null })

  return (
    <div className="space-y-2">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert className="border-brand/30 bg-brand/10">
          <AlertDescription className="text-brand">{state.success}</AlertDescription>
        </Alert>
      )}

      <form action={action} className="flex gap-2">
        <input type="hidden" name="groupId" value={groupId} />
        <select name="playerId" required disabled={isPending} className={selectClass}>
          <option value="">Selecciona un jugador...</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} — {p.email}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Inscribiendo...' : 'Inscribir'}
        </Button>
      </form>
    </div>
  )
}
