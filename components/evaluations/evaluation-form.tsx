'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TechnicalModule, initShotState, type ShotState } from './technical-module'
import { TacticalModule, initGames } from './tactical-module'
import { AnthropometricModule } from './anthropometric-module'
import { PhysicalModule } from './physical-module'
import {
  createEvaluation,
  saveTechnicalShots,
  saveTacticalGames,
  saveAnthropometric,
  savePhysical,
  type PlayerOption,
  type AnthropometricData,
  type PhysicalData,
  type TacticalGame,
  type TechnicalShot,
} from '@/actions/evaluations'
import { STROKE_GROUPS } from '@/lib/eval-strokes'

const TABS = ['Técnico', 'Táctico', 'Antropométrico', 'Físico'] as const

const selectClass =
  'w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

interface Props {
  role:           'admin' | 'coach'
  currentUserId:  string
  players:        PlayerOption[]
  defaultPlayerId?: string
}

export function EvaluationForm({ role, currentUserId, players, defaultPlayerId }: Props) {
  const router  = useRouter()

  // Header
  const [playerId,    setPlayerId]    = useState(defaultPlayerId ?? '')
  const [title,       setTitle]       = useState('')
  const [evaluatedAt, setEvaluatedAt] = useState(new Date().toISOString().split('T')[0])

  // Modules
  const [shots,    setShots]    = useState<ShotState>(initShotState())
  const [games,    setGames]    = useState<TacticalGame[]>(initGames())
  const [anthro,   setAnthro]   = useState<AnthropometricData>({})
  const [physical, setPhysical] = useState<PhysicalData>({})

  // UI
  const [activeTab,  setActiveTab]  = useState(0)
  const [isPending,  setIsPending]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  function buildShots(): TechnicalShot[] {
    return STROKE_GROUPS.flatMap(({ group, strokes }) =>
      strokes.map((strokeName) => {
        const [s1 = false, s2 = false, s3 = false, s4 = false, s5 = false] = shots[strokeName] ?? []
        return { strokeGroup: group, strokeName, s1, s2, s3, s4, s5 }
      }),
    )
  }

  async function handleSave() {
    if (!playerId) { setError('Seleccioná un jugador'); return }
    if (!title.trim()) { setError('Ingresá un título para la evaluación'); return }

    setError(null)
    setIsPending(true)

    try {
      const result = await createEvaluation(playerId, currentUserId, title.trim(), evaluatedAt)
      if ('error' in result) { setError(result.error); return }
      const evalId = result.id

      // Save modules that have data
      const shotData = buildShots()
      const hasTech  = shotData.some((s) => s.s1 || s.s2 || s.s3 || s.s4 || s.s5)
      if (hasTech) await saveTechnicalShots(evalId, shotData)

      const gameData = games.filter((g) => g.ptsPlayer !== null || g.ptsRival !== null)
      if (gameData.length > 0) await saveTacticalGames(evalId, gameData)

      const hasAnthro = Object.values(anthro).some((v) => v != null)
      if (hasAnthro) await saveAnthropometric(evalId, anthro)

      const hasPhys = Object.values(physical).some((v) => v != null)
      if (hasPhys) await savePhysical(evalId, physical)

      router.push(`/${role}/evaluations/${evalId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Header fields ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border p-4 space-y-4 bg-card">
        <h2 className="text-sm font-semibold">Datos de la evaluación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="playerId">Jugador</Label>
            <select
              id="playerId"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className={selectClass}
              disabled={isPending}
            >
              <option value="">Seleccionar jugador...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ej: Evaluación inicial T1 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="evaluatedAt">Fecha</Label>
            <Input
              id="evaluatedAt"
              type="date"
              value={evaluatedAt}
              onChange={(e) => setEvaluatedAt(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* ─── Tab nav ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? 'border-[#00C4CC] text-[#00C4CC]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ─── Tab panels ───────────────────────────────────────────────── */}
      <div>
        {activeTab === 0 && <TechnicalModule value={shots}   onChange={setShots}   />}
        {activeTab === 1 && <TacticalModule  value={games}   onChange={setGames}   />}
        {activeTab === 2 && <AnthropometricModule value={anthro} onChange={setAnthro} />}
        {activeTab === 3 && <PhysicalModule   value={physical} onChange={setPhysical} />}
      </div>

      {/* ─── Navigation + save ────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button" variant="outline"
          onClick={() => setActiveTab((t) => Math.max(0, t - 1))}
          disabled={activeTab === 0 || isPending}
        >
          Anterior
        </Button>

        <div className="flex items-center gap-3">
          {activeTab < TABS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setActiveTab((t) => Math.min(TABS.length - 1, t + 1))}
              disabled={isPending}
            >
              Siguiente
            </Button>
          ) : (
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar evaluación'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
