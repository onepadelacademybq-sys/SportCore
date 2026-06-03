'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList, Plus, Calendar, CreditCard, CheckCircle,
  Clock, AlertCircle, Eye, X, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  scheduleEvaluationAction,
  confirmEvaluationPaymentAction,
  requestEvaluationAction,
  getEvaluationProofUrl,
} from '@/actions/evaluations'
import type { EvaluationSummary, EvaluationStatus, EvaluationFlowState } from '@/actions/evaluations'

// ─── Types & helpers ──────────────────────────────────────────────────────────

interface Coach { id: string; full_name: string }
interface Player { id: string; full_name: string }

interface Props {
  evaluations: EvaluationSummary[]
  coaches:     Coach[]
  players:     Player[]
}

const STATUS_LABEL: Record<EvaluationStatus, string> = {
  requested:       'Solicitadas',
  scheduled:       'Agendadas',
  payment_pending: 'Pago pendiente',
  confirmed:       'Confirmadas',
  completed:       'Completadas',
}

const STATUS_COLOR: Record<EvaluationStatus, string> = {
  requested:       'bg-amber-500/10 text-amber-500',
  scheduled:       'bg-blue-500/10 text-blue-400',
  payment_pending: 'bg-orange-500/10 text-orange-400',
  confirmed:       'bg-emerald-500/10 text-emerald-500',
  completed:       'bg-muted text-muted-foreground',
}

const STATUS_ICON: Record<EvaluationStatus, React.ElementType> = {
  requested:       Clock,
  scheduled:       Calendar,
  payment_pending: CreditCard,
  confirmed:       CheckCircle,
  completed:       ClipboardList,
}

const ALL_TABS: EvaluationStatus[] = ['requested', 'scheduled', 'payment_pending', 'confirmed', 'completed']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatScheduled(date: string | null, time: string | null) {
  if (!date) return '—'
  const d = new Date(`${date}T${time ?? '00:00'}`)
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) +
    (time ? ` a las ${time.slice(0, 5)}` : '')
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────

function ScheduleModal({
  evaluation,
  coaches,
  onClose,
}: {
  evaluation: EvaluationSummary
  coaches:    Coach[]
  onClose:    () => void
}) {
  const [state, setState] = useState<EvaluationFlowState>({ error: null })
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('evalId', evaluation.id)
    startTransition(async () => {
      const result = await scheduleEvaluationAction({ error: null }, formData)
      setState(result)
      if (!result.error) onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Agendar evaluación</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground">{evaluation.title} — {evaluation.player.full_name}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="scheduledDate" className="text-xs">Fecha</Label>
              <Input id="scheduledDate" name="scheduledDate" type="date" required defaultValue={evaluation.scheduledDate ?? ''} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="scheduledTime" className="text-xs">Hora</Label>
              <Input id="scheduledTime" name="scheduledTime" type="time" required defaultValue={evaluation.scheduledTime?.slice(0,5) ?? ''} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="coachId" className="text-xs">Entrenador</Label>
            <select
              id="coachId"
              name="coachId"
              defaultValue={evaluation.coach?.id ?? ''}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Sin asignar</option>
              {coaches.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="paymentAmount" className="text-xs">Valor ($)</Label>
            <Input id="paymentAmount" name="paymentAmount" type="number" min="0" step="1000" defaultValue={evaluation.paymentAmount ?? 270000} />
          </div>

          {state.error && <p className="text-xs text-red-400">{state.error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" size="sm" disabled={isPending} className="flex-1">
              {isPending ? 'Guardando…' : 'Agendar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Proof Viewer ─────────────────────────────────────────────────────────────

function ProofButton({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleView() {
    setLoading(true)
    const signed = await getEvaluationProofUrl(path)
    setLoading(false)
    if (signed) window.open(signed, '_blank')
  }

  return (
    <button
      onClick={handleView}
      disabled={loading}
      className="flex items-center gap-1 text-xs text-[#00C4CC] hover:underline disabled:opacity-50"
    >
      <Eye className="h-3 w-3" />
      {loading ? 'Cargando…' : 'Ver comprobante'}
    </button>
  )
}

// ─── Confirm Payment ──────────────────────────────────────────────────────────

function ConfirmPaymentButton({ evalId }: { evalId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('evalId', evalId)
      const result = await confirmEvaluationPaymentAction({ error: null }, formData)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button size="sm" onClick={handleConfirm} disabled={isPending} className="h-7 text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        {isPending ? 'Confirmando…' : 'Confirmar pago'}
      </Button>
    </div>
  )
}

// ─── Request Form (Admin) ─────────────────────────────────────────────────────

function AdminRequestForm({ players, onClose }: { players: Player[]; onClose: () => void }) {
  const [state, setState] = useState<EvaluationFlowState>({ error: null })
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await requestEvaluationAction({ error: null }, formData)
      setState(result)
      if (!result.error) onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Solicitar evaluación</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="playerId" className="text-xs">Jugador</Label>
            <select name="playerId" required className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Seleccionar jugador</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs">Título / descripción</Label>
            <Input name="title" placeholder="Ej: Evaluación Protocolo V3 – Jun 2026" required />
          </div>
          {state.error && <p className="text-xs text-red-400">{state.error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" size="sm" disabled={isPending} className="flex-1">{isPending ? 'Solicitando…' : 'Solicitar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Evaluation Row ───────────────────────────────────────────────────────────

function EvalRow({
  ev,
  coaches,
  onSchedule,
}: {
  ev:         EvaluationSummary
  coaches:    Coach[]
  onSchedule: (ev: EvaluationSummary) => void
}) {
  const Icon = STATUS_ICON[ev.evaluationStatus]

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-t border-border hover:bg-muted/20 transition-colors">
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${STATUS_COLOR[ev.evaluationStatus].split(' ')[1]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{ev.title}</p>
        <p className="text-xs text-muted-foreground">{ev.player.full_name}</p>
        {ev.evaluationStatus !== 'requested' && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatScheduled(ev.scheduledDate, ev.scheduledTime)}
            {ev.paymentAmount && ` · $${Number(ev.paymentAmount).toLocaleString('es-CO')}`}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {ev.evaluationStatus === 'requested' && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSchedule(ev)}>
            <Calendar className="h-3 w-3 mr-1" />
            Agendar
          </Button>
        )}
        {ev.evaluationStatus === 'scheduled' && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSchedule(ev)}>
            <Calendar className="h-3 w-3 mr-1" />
            Editar fecha
          </Button>
        )}
        {ev.evaluationStatus === 'payment_pending' && (
          <div className="flex flex-col items-end gap-1">
            {ev.paymentProofUrl && <ProofButton path={ev.paymentProofUrl} />}
            <ConfirmPaymentButton evalId={ev.id} />
          </div>
        )}
        {(ev.evaluationStatus === 'confirmed' || ev.evaluationStatus === 'completed') && (
          <Link href={`/admin/evaluations/${ev.id}`}>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
              Ver datos
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[ev.evaluationStatus]}`}>
          {formatDate(ev.evaluatedAt)}
        </span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminEvalPanel({ evaluations, coaches, players }: Props) {
  const [activeTab, setActiveTab] = useState<EvaluationStatus>('requested')
  const [scheduleTarget, setScheduleTarget] = useState<EvaluationSummary | null>(null)
  const [showRequest, setShowRequest] = useState(false)

  const byStatus = ALL_TABS.reduce<Record<EvaluationStatus, EvaluationSummary[]>>(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as Record<EvaluationStatus, EvaluationSummary[]>,
  )
  for (const ev of evaluations) byStatus[ev.evaluationStatus]?.push(ev)

  const filtered = byStatus[activeTab] ?? []

  return (
    <>
      {scheduleTarget && (
        <ScheduleModal
          evaluation={scheduleTarget}
          coaches={coaches}
          onClose={() => setScheduleTarget(null)}
        />
      )}
      {showRequest && (
        <AdminRequestForm players={players} onClose={() => setShowRequest(false)} />
      )}

      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">{evaluations.length} evaluación{evaluations.length !== 1 ? 'es' : ''} en total</p>
          <Button size="sm" className="gap-2" onClick={() => setShowRequest(true)}>
            <Plus className="h-4 w-4" />
            Solicitar evaluación
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {ALL_TABS.map(tab => {
            const count = byStatus[tab].length
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {STATUS_LABEL[tab]}
                {count > 0 && (
                  <span className={`min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none ${
                    activeTab === tab ? 'bg-white/20' : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* List */}
        <div className="rounded-lg border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-10 text-center space-y-1">
              <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm text-muted-foreground">No hay evaluaciones en este estado.</p>
            </div>
          ) : (
            filtered.map(ev => (
              <EvalRow key={ev.id} ev={ev} coaches={coaches} onSchedule={setScheduleTarget} />
            ))
          )}
        </div>
      </div>
    </>
  )
}
