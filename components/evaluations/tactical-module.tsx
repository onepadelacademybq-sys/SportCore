'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TacticalGame, GameStats } from '@/actions/evaluations'

type StatKey = keyof GameStats

const SERVICE_STATS: { key: StatKey; label: string }[] = [
  { key: 'primer_srv',  label: '1er Servicio'   },
  { key: 'segundo_srv', label: '2do Servicio'   },
  { key: 'err_dev',     label: 'Error Devolución' },
  { key: 'doble_falta', label: 'Doble Falta'    },
]

const WINNER_STATS: { key: StatKey; label: string }[] = [
  { key: 'w_drive',   label: 'W Drive'   },
  { key: 'w_reves',   label: 'W Revés'   },
  { key: 'w_smash',   label: 'W Smash'   },
  { key: 'w_bandeja', label: 'W Bandeja' },
  { key: 'w_volea',   label: 'W Volea'   },
]

const ERROR_STATS: { key: StatKey; label: string }[] = [
  { key: 'e_drive',   label: 'E Drive'   },
  { key: 'e_reves',   label: 'E Revés'   },
  { key: 'e_smash',   label: 'E Smash'   },
  { key: 'e_bandeja', label: 'E Bandeja' },
  { key: 'e_volea',   label: 'E Volea'   },
]

function StatCounter({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | undefined
  onChange: (n: number) => void
}) {
  const n = value ?? 0
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground truncate">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, n - 1))}
          className="w-6 h-6 rounded border border-border text-muted-foreground hover:bg-muted text-xs flex items-center justify-center"
        >
          −
        </button>
        <span className="w-5 text-center text-xs font-medium tabular-nums">{n}</span>
        <button
          type="button"
          onClick={() => onChange(n + 1)}
          className="w-6 h-6 rounded border border-border text-muted-foreground hover:bg-muted text-xs flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  )
}

function StatsPanel({
  title,
  stats,
  onChange,
}: {
  title: string
  stats: GameStats
  onChange: (updated: GameStats) => void
}) {
  function set(key: StatKey, n: number) {
    onChange({ ...stats, [key]: n })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Servicios</p>
          {SERVICE_STATS.map(({ key, label }) => (
            <StatCounter key={key} label={label} value={(stats as Record<string, number>)[key]} onChange={(n) => set(key, n)} />
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Winners</p>
          {WINNER_STATS.map(({ key, label }) => (
            <StatCounter key={key} label={label} value={(stats as Record<string, number>)[key]} onChange={(n) => set(key, n)} />
          ))}
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider pt-1">Errores</p>
          {ERROR_STATS.map(({ key, label }) => (
            <StatCounter key={key} label={label} value={(stats as Record<string, number>)[key]} onChange={(n) => set(key, n)} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  value:    TacticalGame[]
  onChange: (v: TacticalGame[]) => void
}

export function initGames(): TacticalGame[] {
  return Array.from({ length: 6 }, (_, i) => ({
    gameNumber: i + 1,
    ptsPlayer:  null,
    ptsRival:   null,
    driveStats: {},
    revesStats: {},
  }))
}

export function TacticalModule({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0)

  function updateGame(idx: number, partial: Partial<TacticalGame>) {
    const next = value.map((g, i) => (i === idx ? { ...g, ...partial } : g))
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {value.map((game, idx) => {
        const hasScore   = game.ptsPlayer !== null || game.ptsRival !== null
        const isOpen     = expanded === idx
        const scoreLabel = hasScore ? `${game.ptsPlayer ?? '?'} — ${game.ptsRival ?? '?'}` : 'Sin datos'

        return (
          <div key={game.gameNumber} className="rounded-lg border border-border overflow-hidden">
            {/* Game header */}
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : idx)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">Game {game.gameNumber}</span>
                {hasScore && (
                  <span className="text-xs text-brand font-medium tabular-nums">{scoreLabel}</span>
                )}
                {!hasScore && (
                  <span className="text-xs text-muted-foreground">Registrar</span>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {/* Game content */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-5 border-t border-border">
                {/* Score */}
                <div className="flex items-center gap-3 pt-4">
                  <span className="text-xs text-muted-foreground">Marcador:</span>
                  <input
                    type="number" min="0"
                    placeholder="Nosotros"
                    value={game.ptsPlayer ?? ''}
                    onChange={(e) => updateGame(idx, { ptsPlayer: e.target.value === '' ? null : parseInt(e.target.value) })}
                    className="w-20 rounded-md border border-border bg-input px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-muted-foreground text-sm">—</span>
                  <input
                    type="number" min="0"
                    placeholder="Rivales"
                    value={game.ptsRival ?? ''}
                    onChange={(e) => updateGame(idx, { ptsRival: e.target.value === '' ? null : parseInt(e.target.value) })}
                    className="w-20 rounded-md border border-border bg-input px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Drive */}
                <StatsPanel
                  title="Drive"
                  stats={game.driveStats}
                  onChange={(s) => updateGame(idx, { driveStats: s })}
                />

                {/* Revés */}
                <StatsPanel
                  title="Revés"
                  stats={game.revesStats}
                  onChange={(s) => updateGame(idx, { revesStats: s })}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
