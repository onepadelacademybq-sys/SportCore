'use client'

import { useActionState, useState } from 'react'
import { registerForTournamentAction } from '@/actions/tournaments'
import { Button } from '@/components/ui/button'
import { UserPlus, X } from 'lucide-react'

interface Player {
  id: string
  full_name: string
}

interface Props {
  tournamentId: string
  requiresPartner: boolean
  players: Player[]
  currentPlayerId: string
}

export function RegisterForm({ tournamentId, requiresPartner, players, currentPlayerId }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(registerForTournamentAction, null)

  if (state?.success && open) setOpen(false)

  const partners = players.filter(p => p.id !== currentPlayerId)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4 mr-1.5" />
        Inscribirme
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-semibold">Inscripción al torneo</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={action} className="p-4 space-y-4">
              <input type="hidden" name="tournament_id" value={tournamentId} />

              {requiresPartner ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Selecciona tu compañero/a *
                  </label>
                  <select
                    name="player2_id"
                    required
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar jugador…</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Tu nombre se registrará como Jugador 1 de la pareja.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este torneo es de inscripción individual. El admin asignará parejas.
                </p>
              )}

              {state?.error && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">{state.error}</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={pending} className="flex-1" size="sm">
                  {pending ? 'Enviando…' : 'Confirmar inscripción'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
