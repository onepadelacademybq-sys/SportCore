'use client'

import { useTransition, useState } from 'react'
import {
  updateTournamentStatusAction,
  generateMatchesAction,
  createNextRoundAction,
  generateNextReyPistaRoundAction,
  type TournamentStatus,
} from '@/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Play, Trophy, XCircle, Shuffle, ChevronRight } from 'lucide-react'

const AMERICANO_FORMATS = [
  'americano_individual', 'americano_mixto', 'super_8',
  'americano_parejas', 'americano_rey_pista',
]

interface Props {
  tournamentId: string
  status: TournamentStatus
  format: string
  confirmedCount: number
}

export function TournamentStatusActions({ tournamentId, status, format, confirmedCount }: Props) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const isAmericano = AMERICANO_FORMATS.includes(format)
  const minPlayers = format === 'super_8' ? 8 : 2
  const canGenerate = format === 'super_8' ? confirmedCount === 8 : confirmedCount >= minPlayers

  async function run(fn: () => Promise<{ success?: boolean; error?: string }>) {
    start(async () => {
      const res = await fn()
      if (res.error) setMsg(res.error)
      else setMsg(null)
    })
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {status === 'draft' && (
        <Button size="sm" onClick={() => run(() => updateTournamentStatusAction(tournamentId, 'open'))}>
          <Play className="h-3.5 w-3.5 mr-1.5" />
          {pending ? 'Actualizando…' : 'Abrir inscripciones'}
        </Button>
      )}

      {status === 'open' && canGenerate && (
        <Button
          size="sm"
          onClick={() => run(() => generateMatchesAction(tournamentId))}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Shuffle className="h-3.5 w-3.5 mr-1.5" />
          {pending ? 'Generando…' : isAmericano ? 'Generar rondas' : 'Generar cuadro'}
        </Button>
      )}

      {status === 'open' && format === 'super_8' && confirmedCount !== 8 && (
        <p className="text-xs text-amber-400">Super 8 requiere exactamente 8 jugadores ({confirmedCount}/8)</p>
      )}

      {status === 'in_progress' && (
        <Button size="sm" variant="outline" onClick={() => run(() => updateTournamentStatusAction(tournamentId, 'completed'))}>
          <Trophy className="h-3.5 w-3.5 mr-1.5" />
          {pending ? '…' : 'Finalizar torneo'}
        </Button>
      )}

      {(status === 'draft' || status === 'open') && (
        <Button
          size="sm"
          variant="outline"
          className="text-red-400 border-red-400/30 hover:bg-red-400/10"
          onClick={() => run(() => updateTournamentStatusAction(tournamentId, 'cancelled'))}
        >
          <XCircle className="h-3.5 w-3.5 mr-1.5" />
          {pending ? '…' : 'Cancelar torneo'}
        </Button>
      )}

      {msg && <p className="text-sm text-red-400">{msg}</p>}
    </div>
  )
}

export function NextRoundButton({ tournamentId, currentRound }: { tournamentId: string; currentRound: string }) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => start(async () => {
          const res = await createNextRoundAction(tournamentId, currentRound)
          if (res.error) setMsg(res.error)
          else if ((res as any).finished) setMsg('¡Torneo finalizado! Marca el torneo como completado.')
          else setMsg(null)
        })}
      >
        <ChevronRight className="h-3.5 w-3.5 mr-1.5" />
        {pending ? 'Generando…' : 'Generar siguiente ronda'}
      </Button>
      {msg && <p className="text-sm text-amber-400">{msg}</p>}
    </div>
  )
}

export function ReyPistaNextRoundButton({ tournamentId }: { tournamentId: string }) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => start(async () => {
          const res = await generateNextReyPistaRoundAction(tournamentId)
          if (res.error) setMsg(res.error)
          else setMsg(null)
        })}
      >
        <ChevronRight className="h-3.5 w-3.5 mr-1.5" />
        {pending ? 'Generando…' : 'Siguiente ronda (Rey de pista)'}
      </Button>
      {msg && <p className="text-sm text-amber-400">{msg}</p>}
    </div>
  )
}
