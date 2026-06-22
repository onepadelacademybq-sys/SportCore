'use client'

import { useState, useEffect, useRef } from 'react'
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
  const router    = useRouter()
  const draftKey  = `sc_eval_draft_${currentUserId}`
  const canSaveRef = useRef(false) // evita sobreescribir un borrador antes de que el usuario lo vea

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
  const [hasDraft,   setHasDraft]   = useState(false)

  // ─── Draft: comprobar borrador guardado al montar ────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) { canSaveRef.current = true; return }
      const d = JSON.parse(raw) as { savedAt?: number; title?: string; playerId?: string }
      const fresh = Date.now() - (d.savedAt ?? 0) < 24 * 60 * 60 * 1000
      if (fresh && (d.title || (d.playerId && d.playerId !== (defaultPlayerId ?? '')))) {
        setHasDraft(true) // mostrar banner; auto-save queda suspendido hasta que el usuario decida
      } else {
        localStorage.removeItem(draftKey)
        canSaveRef.current = true
      }
    } catch {
      localStorage.removeItem(draftKey)
      canSaveRef.current = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Draft: auto-guardar en localStorage cuando cambia contenido ─────────────
  useEffect(() => {
    if (!canSaveRef.current) return
    if (!title && !playerId) return // no guardar formulario vacío
    localStorage.setItem(draftKey, JSON.stringify({
      playerId, title, evaluatedAt, shots, games, anthro, physical, savedAt: Date.now(),
    }))
  }, [playerId, title, evaluatedAt, shots, games, anthro, physical]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Guardia beforeunload: advierte si hay datos sin guardar ─────────────────
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (!title && !playerId) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [title, playerId])

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const d = JSON.parse(raw)
      if (d.playerId)    setPlayerId(d.playerId)
      if (d.title)       setTitle(d.title)
      if (d.evaluatedAt) setEvaluatedAt(d.evaluatedAt)
      if (d.shots)       setShots(d.shots)
      if (d.games)       setGames(d.games)
      if (d.anthro)      setAnthro(d.anthro)
      if (d.physical)    setPhysical(d.physical)
    } catch { /* draft corrupto — ignorar */ }
    setHasDraft(false)
    canSaveRef.current = true
  }

  function dismissDraft() {
    localStorage.removeItem(draftKey)
    setHasDraft(false)
    canSaveRef.current = true
  }

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

      localStorage.removeItem(draftKey)
      router.push(`/${role}/evaluations/${evalId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Banner de recuperación de borrador ──────────────────────── */}
      {hasDraft && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3">
          <p className="text-sm text-amber-400">
            Hay un borrador guardado de una evaluación anterior. ¿Querés recuperarlo?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={restoreDraft}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              Recuperar
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

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
                ? 'border-brand text-brand'
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
