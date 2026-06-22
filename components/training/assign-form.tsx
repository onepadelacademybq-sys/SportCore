'use client'

import { useActionState } from 'react'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { assignMesocycleAction, removeAssignmentAction } from '@/actions/training'
import type { MesocycleAssignment } from '@/actions/training'

const selectClass =
  'w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

interface Props {
  mesocycleId: string
  assignments: MesocycleAssignment[]
  players: { id: string; full_name: string; email: string }[]
  groups:  { id: string; name: string; level: string }[]
}

function RemoveButton({ assignmentId }: { assignmentId: string }) {
  const [state, action, isPending] = useActionState(removeAssignmentAction, { error: null })
  return (
    <form action={action}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        {isPending ? '…' : 'Quitar'}
      </button>
      {state.error && <span className="text-xs text-destructive ml-2">{state.error}</span>}
    </form>
  )
}

export function AssignForm({ mesocycleId, assignments, players, groups }: Props) {
  const [state, formAction, isPending] = useActionState(assignMesocycleAction, { error: null })
  const [targetType, setTargetType] = useState<'player' | 'group'>('player')

  return (
    <div className="space-y-4">
      {/* Current assignments */}
      {assignments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Asignado a:</p>
          <ul className="space-y-1">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-md bg-muted">
                <span>
                  {a.player ? `👤 ${a.player.full_name}` : a.group ? `👥 ${a.group.name}` : '—'}
                </span>
                <RemoveButton assignmentId={a.id} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assign form */}
      <form action={formAction} className="space-y-3">
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

        <input type="hidden" name="mesocycleId" value={mesocycleId} />

        {/* Toggle player / group */}
        <div className="flex gap-2">
          {(['player', 'group'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTargetType(t)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                targetType === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'player' ? 'Jugador' : 'Grupo'}
            </button>
          ))}
        </div>

        {targetType === 'player' ? (
          <div className="space-y-2">
            <Label htmlFor="playerId">Jugador</Label>
            <select id="playerId" name="playerId" required disabled={isPending} className={selectClass}>
              <option value="">Seleccionar jugador…</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} — {p.email}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="groupId">Grupo</Label>
            <select id="groupId" name="groupId" required disabled={isPending} className={selectClass}>
              <option value="">Seleccionar grupo…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        <Button type="submit" size="sm" disabled={isPending} className="gap-2">
          <UserPlus className="h-3.5 w-3.5" />
          {isPending ? 'Asignando…' : 'Asignar'}
        </Button>
      </form>
    </div>
  )
}
