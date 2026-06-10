'use client'

import { useState, useTransition } from 'react'
import { UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { recordAttendanceAction } from '@/actions/training'
import type { TrainingState } from '@/actions/training'

type Player = { id: string; fullName: string; avatarUrl: string | null }
type AttendanceRecord = { status: string; notes: string | null }

interface Props {
  sessionId:         string
  players:           Player[]
  initialAttendance: Record<string, AttendanceRecord>
}

const STATUS_OPTIONS = [
  { value: 'present',   label: 'Presente',    active: 'border-green-500/40 bg-green-500/10 text-green-400' },
  { value: 'absent',    label: 'Ausente',     active: 'border-red-500/40 bg-red-500/10 text-red-400' },
  { value: 'justified', label: 'Justificado', active: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
]

export function AttendancePanel({ sessionId, players, initialAttendance }: Props) {
  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const p of players) {
      init[p.id] = initialAttendance[p.id]?.status ?? 'present'
    }
    return init
  })

  const [result,     setResult]     = useState<TrainingState | null>(null)
  const [isPending,  startTransition] = useTransition()

  const hasExisting = Object.keys(initialAttendance).length > 0

  const presentCount   = Object.values(statuses).filter((s) => s === 'present').length
  const absentCount    = Object.values(statuses).filter((s) => s === 'absent').length
  const justifiedCount = Object.values(statuses).filter((s) => s === 'justified').length

  function setStatus(playerId: string, status: string) {
    setStatuses((prev) => ({ ...prev, [playerId]: status }))
    setResult(null)
  }

  function handleSubmit() {
    const records = players.map((p) => ({
      playerId: p.id,
      status:   statuses[p.id] ?? 'present',
    }))

    const fd = new FormData()
    fd.set('sessionId',      sessionId)
    fd.set('attendanceJson', JSON.stringify(records))

    startTransition(async () => {
      const res = await recordAttendanceAction({ error: null }, fd)
      setResult(res)
    })
  }

  if (players.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Sin jugadores asignados a este mesociclo. Asigna jugadores o grupos desde la planificación.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div>
          <h2 className="font-semibold text-sm">Asistencia</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {players.length} jugador{players.length !== 1 ? 'es' : ''}
            {hasExisting && ' · Registrada anteriormente'}
          </p>
        </div>
        {/* Summary pills */}
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
            {presentCount}P
          </span>
          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">
            {absentCount}A
          </span>
          {justifiedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
              {justifiedCount}J
            </span>
          )}
        </div>
      </div>

      {/* Player rows */}
      <div className="divide-y">
        {players.map((player) => {
          const currentStatus = statuses[player.id] ?? 'present'
          const initials = player.fullName
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()

          return (
            <div key={player.id} className="flex items-center gap-3 px-5 py-3">
              {/* Avatar */}
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt={player.fullName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
              )}

              {/* Name */}
              <p className="flex-1 text-sm font-medium min-w-0 truncate">{player.fullName}</p>

              {/* Status toggle */}
              <div className="flex gap-1 shrink-0">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(player.id, opt.value)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      currentStatus === opt.value
                        ? opt.active
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-t bg-muted/20">
        <div className="text-xs">
          {result?.error   && <span className="text-red-400">{result.error}</span>}
          {result?.success && <span className="text-green-400">{result.success}</span>}
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={isPending} className="shrink-0">
          <UserCheck className="h-3.5 w-3.5 mr-1.5" />
          {isPending
            ? 'Guardando…'
            : hasExisting
            ? 'Actualizar asistencia'
            : 'Registrar asistencia'
          }
        </Button>
      </div>
    </div>
  )
}
