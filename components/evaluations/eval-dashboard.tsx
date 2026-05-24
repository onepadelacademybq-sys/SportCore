'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateEvaluationNotes } from '@/actions/evaluations'
import type { DashboardData, TrafficLight } from '@/actions/evaluations'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LIGHT_RING: Record<TrafficLight, string> = {
  verde:    'ring-2 ring-emerald-500 bg-emerald-500/10',
  amarillo: 'ring-2 ring-amber-500  bg-amber-500/10',
  rojo:     'ring-2 ring-red-400    bg-red-400/10',
}

const LIGHT_DOT: Record<TrafficLight, string> = {
  verde:    'bg-emerald-500',
  amarillo: 'bg-amber-500',
  rojo:     'bg-red-400',
}

const LIGHT_TEXT: Record<TrafficLight, string> = {
  verde:    'text-emerald-500',
  amarillo: 'text-amber-500',
  rojo:     'text-red-400',
}

const PRIORITY_LABEL: Record<string, string> = {
  Alta:  'bg-red-500/10 text-red-400',
  Media: 'bg-amber-500/10 text-amber-500',
  Baja:  'bg-emerald-500/10 text-emerald-500',
}

function fmtTime(seconds: number | null): string {
  if (seconds === null) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtNum(n: number | null, decimals = 2): string {
  if (n === null) return '—'
  return n.toFixed(decimals)
}

// ─── Technical semaphore ─────────────────────────────────────────────────────

function TechSection({ data }: { data: NonNullable<DashboardData['technical']> }) {
  return (
    <div className="space-y-4">
      {/* Overall */}
      <div className={`rounded-lg p-4 flex items-center justify-between ${LIGHT_RING[data.overallLight]}`}>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Técnico global</p>
          <p className={`text-3xl font-bold mt-0.5 ${LIGHT_TEXT[data.overallLight]}`}>{data.overallPct}%</p>
        </div>
        <div className={`w-5 h-5 rounded-full ${LIGHT_DOT[data.overallLight]}`} />
      </div>

      {/* By group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.byGroup.map((g) => (
          <div key={g.group} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{g.label}</span>
              <div className={`w-3 h-3 rounded-full ${LIGHT_DOT[g.light]}`} />
            </div>

            {/* Bar */}
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  g.light === 'verde' ? 'bg-emerald-500' : g.light === 'amarillo' ? 'bg-amber-500' : 'bg-red-400'
                }`}
                style={{ width: `${g.avgPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold ${LIGHT_TEXT[g.light]}`}>{g.avgPct}%</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_LABEL[g.priority]}`}>
                Prioridad {g.priority}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">{g.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tactical section ─────────────────────────────────────────────────────────

function TacticalSection({ data }: { data: NonNullable<DashboardData['tactical']> }) {
  const ratio = data.totalErrors > 0 ? (data.totalWinners / data.totalErrors).toFixed(2) : '∞'

  const SHOT_LABELS: Record<string, string> = {
    w_drive: 'Drive', e_drive: 'Drive',
    w_reves: 'Revés', e_reves: 'Revés',
    w_smash: 'Smash', e_smash: 'Smash',
    w_bandeja: 'Bandeja', e_bandeja: 'Bandeja',
    w_volea: 'Volea', e_volea: 'Volea',
  }

  const shotTypes = ['drive', 'reves', 'smash', 'bandeja', 'volea']

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Games</p>
          <p className="text-2xl font-bold">{data.games}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Winners</p>
          <p className="text-2xl font-bold text-emerald-500">{data.totalWinners}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Errores</p>
          <p className="text-2xl font-bold text-red-400">{data.totalErrors}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Ratio W/E: <span className="font-semibold text-foreground">{ratio}</span>
      </p>

      {/* By shot type */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-3 text-[10px] text-muted-foreground bg-muted/40 px-3 py-1.5 uppercase tracking-wide font-medium">
          <span>Golpe</span>
          <span className="text-center text-emerald-500">Winners</span>
          <span className="text-center text-red-400">Errores</span>
        </div>
        {shotTypes.map((type) => {
          const w = data.winnersByType[`w_${type}`] ?? 0
          const e = data.errorsByType[`e_${type}`]  ?? 0
          return (
            <div key={type} className="grid grid-cols-3 px-3 py-2 border-t border-border text-sm items-center">
              <span className="text-xs capitalize">{SHOT_LABELS[`w_${type}`]}</span>
              <span className="text-center text-xs font-medium text-emerald-500">{w}</span>
              <span className="text-center text-xs font-medium text-red-400">{e}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Physical section ─────────────────────────────────────────────────────────

function PhysicalSection({ data }: { data: NonNullable<DashboardData['physical']> }) {
  const rows: { label: string; value: string; unit: string }[] = [
    { label: 'Squat Jump (SJ)',      value: fmtNum(data.bestSJ),           unit: 'cm'  },
    { label: 'CMJ',                  value: fmtNum(data.bestCMJ),          unit: 'cm'  },
    { label: 'Abalakov',             value: fmtNum(data.bestAbalakov),     unit: 'cm'  },
    { label: 'Sprint 10m',           value: fmtNum(data.bestVel10m, 3),    unit: 's'   },
    { label: '8 Bolas Lateral',      value: fmtNum(data.bestBolasLateral, 3), unit: 's'},
    { label: '8 Bolas Frontal',      value: fmtNum(data.bestBolasFrontal, 3), unit: 's'},
    { label: 'Desplaz. Lat. D',      value: fmtNum(data.desplazLatD, 3),   unit: 's'   },
    { label: 'Desplaz. Lat. I',      value: fmtNum(data.desplazLatI, 3),   unit: 's'   },
    { label: 'Gincana Zig-Zag',      value: fmtNum(data.bestZigzag, 3),    unit: 's'   },
    { label: 'Resistencia 5K',       value: fmtTime(data.resistencia5k),   unit: 'mm:ss'},
  ].filter((r) => r.value !== '—')

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-2 text-[10px] text-muted-foreground bg-muted/40 px-3 py-1.5 uppercase tracking-wide font-medium">
        <span>Prueba</span>
        <span className="text-right">Mejor marca</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-2 px-3 py-2 border-t border-border items-center">
          <span className="text-xs">{r.label}</span>
          <span className="text-right text-sm font-semibold tabular-nums">
            {r.value} <span className="text-xs font-normal text-muted-foreground">{r.unit}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Anthropometric section ───────────────────────────────────────────────────

function AnthroSection({ data }: { data: NonNullable<DashboardData['anthropometric']> }) {
  const rows: { label: string; value: number | null | undefined; unit: string }[] = [
    { label: 'Peso',          value: data.peso,               unit: 'kg'  },
    { label: 'Talla',         value: data.talla,              unit: 'cm'  },
    { label: '% Adiposo',     value: data.pctAdiposo,         unit: '%'   },
    { label: '% Músculo',     value: data.pctMusculo,         unit: '%'   },
    { label: 'Edad biológica', value: data.edadBiologica,     unit: 'años'},
    { label: 'Grasa visceral', value: data.grasaVisceral,     unit: ''    },
  ].filter((r) => r.value != null)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-2 text-[10px] text-muted-foreground bg-muted/40 px-3 py-1.5 uppercase tracking-wide font-medium">
        <span>Medición</span>
        <span className="text-right">Valor</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-2 px-3 py-2 border-t border-border items-center">
          <span className="text-xs">{r.label}</span>
          <span className="text-right text-sm font-semibold tabular-nums">
            {Number(r.value).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">{r.unit}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Notes section ────────────────────────────────────────────────────────────

function NotesSection({ evaluationId, initialNotes }: { evaluationId: string; initialNotes: string | null }) {
  const [notes,     setNotes]     = useState(initialNotes ?? '')
  const [saving,    setSaving]    = useState(false)
  const [savedMsg,  setSavedMsg]  = useState(false)

  async function save() {
    setSaving(true)
    await updateEvaluationNotes(evaluationId, notes)
    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Observaciones del evaluador, diagnóstico, recomendaciones..."
        rows={4}
        disabled={saving}
      />
      <div className="flex items-center justify-end gap-3">
        {savedMsg && <span className="text-xs text-emerald-500">Guardado</span>}
        <Button type="button" size="sm" variant="outline" onClick={save} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar observaciones'}
        </Button>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  data:         DashboardData
  evaluationId: string
  notes:        string | null
  showFull?:    boolean   // false = player simplified view
}

export function EvalDashboard({ data, evaluationId, notes, showFull = true }: Props) {
  return (
    <div className="space-y-6">
      {/* Technical */}
      {data.technical ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Módulo Técnico</CardTitle></CardHeader>
          <CardContent><TechSection data={data.technical} /></CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground italic">Módulo técnico sin datos.</p>
      )}

      {/* Tactical */}
      {data.tactical && (
        <Card>
          <CardHeader><CardTitle className="text-base">Módulo Táctico</CardTitle></CardHeader>
          <CardContent><TacticalSection data={data.tactical} /></CardContent>
        </Card>
      )}

      {/* Physical */}
      {data.physical && (
        <Card>
          <CardHeader><CardTitle className="text-base">Módulo Físico — Mejores marcas</CardTitle></CardHeader>
          <CardContent><PhysicalSection data={data.physical} /></CardContent>
        </Card>
      )}

      {/* Anthropometric */}
      {data.anthropometric && (
        <Card>
          <CardHeader><CardTitle className="text-base">Módulo Antropométrico</CardTitle></CardHeader>
          <CardContent><AnthroSection data={data.anthropometric} /></CardContent>
        </Card>
      )}

      {/* Notes — only for coach/admin */}
      {showFull && (
        <Card>
          <CardHeader><CardTitle className="text-base">Observaciones del evaluador</CardTitle></CardHeader>
          <CardContent>
            <NotesSection evaluationId={evaluationId} initialNotes={notes} />
          </CardContent>
        </Card>
      )}

      {/* Read-only notes for player */}
      {!showFull && notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Observaciones</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
