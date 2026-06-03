'use client'

import { useState, useTransition } from 'react'
import {
  ClipboardList, Plus, Calendar, CreditCard, CheckCircle,
  Clock, Upload, X, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  requestEvaluationAction,
  uploadEvaluationPaymentProofAction,
} from '@/actions/evaluations'
import type { EvaluationSummary, EvaluationFlowState, EvaluationStatus } from '@/actions/evaluations'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<EvaluationStatus, string> = {
  requested:       'Solicitada',
  scheduled:       'Agendada — pendiente de pago',
  payment_pending: 'Comprobante enviado',
  confirmed:       'Confirmada',
  completed:       'Completada',
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatScheduled(date: string | null, time: string | null) {
  if (!date) return null
  const d = new Date(`${date}T${time ?? '00:00'}`)
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) +
    (time ? ` a las ${time.slice(0, 5)}` : '')
}

// ─── Request Evaluation Modal ─────────────────────────────────────────────────

function RequestModal({ onClose }: { onClose: () => void }) {
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
        <p className="text-xs text-muted-foreground">
          El administrador revisará tu solicitud y la agendará. El costo del Protocolo V3 es <strong>$270.000</strong>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs">Descripción (opcional)</Label>
            <Input name="title" placeholder="Ej: Evaluación junio 2026" defaultValue={`Evaluación Protocolo V3 – ${new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`} />
          </div>
          {state.error && <p className="text-xs text-red-400">{state.error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" size="sm" disabled={isPending} className="flex-1">{isPending ? 'Enviando…' : 'Solicitar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Upload Proof Modal ───────────────────────────────────────────────────────

function UploadProofModal({ evaluation, onClose }: { evaluation: EvaluationSummary; onClose: () => void }) {
  const [state, setState] = useState<EvaluationFlowState>({ error: null })
  const [isPending, startTransition] = useTransition()
  const [fileName, setFileName] = useState<string>('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('evalId', evaluation.id)
    startTransition(async () => {
      const result = await uploadEvaluationPaymentProofAction({ error: null }, formData)
      setState(result)
      if (!result.error) onClose()
    })
  }

  const scheduled = formatScheduled(evaluation.scheduledDate, evaluation.scheduledTime)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Subir comprobante de pago</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs">
          <p className="font-medium">{evaluation.title}</p>
          {scheduled && <p className="text-muted-foreground">{scheduled}</p>}
          {evaluation.paymentAmount && (
            <p className="text-foreground font-semibold">
              Valor: ${Number(evaluation.paymentAmount).toLocaleString('es-CO')}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Comprobante (JPG, PNG o PDF, máx. 5 MB)</Label>
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {fileName || 'Haz clic para seleccionar'}
              </span>
              <input
                type="file"
                name="paymentProof"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                required
                onChange={e => setFileName(e.target.files?.[0]?.name ?? '')}
              />
            </label>
          </div>
          {state.error && <p className="text-xs text-red-400">{state.error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" size="sm" disabled={isPending} className="flex-1">{isPending ? 'Subiendo…' : 'Enviar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Evaluation Card ──────────────────────────────────────────────────────────

function EvalCard({
  ev,
  onUpload,
}: {
  ev:       EvaluationSummary
  onUpload: (ev: EvaluationSummary) => void
}) {
  const Icon      = STATUS_ICON[ev.evaluationStatus]
  const scheduled = formatScheduled(ev.scheduledDate, ev.scheduledTime)

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${STATUS_COLOR[ev.evaluationStatus].split(' ')[1]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{ev.title}</p>
          {scheduled && (
            <p className="text-xs text-muted-foreground mt-0.5">{scheduled}</p>
          )}
          {ev.paymentAmount && ev.evaluationStatus === 'scheduled' && (
            <p className="text-xs font-semibold text-foreground mt-0.5">
              Valor: ${Number(ev.paymentAmount).toLocaleString('es-CO')}
            </p>
          )}
          {ev.coach && (
            <p className="text-xs text-muted-foreground mt-0.5">Coach: {ev.coach.full_name}</p>
          )}
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[ev.evaluationStatus]}`}>
          {STATUS_LABEL[ev.evaluationStatus]}
        </span>
      </div>

      {ev.evaluationStatus === 'scheduled' && (
        <div className="border-t border-border pt-3">
          <Button size="sm" className="w-full gap-2" onClick={() => onUpload(ev)}>
            <Upload className="h-3 w-3" />
            Subir comprobante de pago
          </Button>
        </div>
      )}

      {ev.evaluationStatus === 'requested' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2">
          <Clock className="h-3 w-3 shrink-0" />
          Esperando que el administrador agende la fecha
        </div>
      )}

      {ev.evaluationStatus === 'payment_pending' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2">
          <AlertCircle className="h-3 w-3 shrink-0" />
          Comprobante enviado — esperando confirmación del administrador
        </div>
      )}

      {ev.evaluationStatus === 'confirmed' && (
        <div className="flex items-center gap-2 text-xs text-emerald-500 border-t border-border pt-2">
          <CheckCircle className="h-3 w-3 shrink-0" />
          Pago confirmado — evaluación lista para realizarse
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlayerEvalPanel({ pendingEvals }: { pendingEvals: EvaluationSummary[] }) {
  const [showRequest, setShowRequest] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<EvaluationSummary | null>(null)

  const active = pendingEvals.filter(e => e.evaluationStatus !== 'completed')

  return (
    <>
      {showRequest && <RequestModal onClose={() => setShowRequest(false)} />}
      {uploadTarget && <UploadProofModal evaluation={uploadTarget} onClose={() => setUploadTarget(null)} />}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Mis evaluaciones en curso</h2>
          <Button size="sm" className="gap-2" onClick={() => setShowRequest(true)}>
            <Plus className="h-4 w-4" />
            Solicitar evaluación
          </Button>
        </div>

        {active.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center space-y-2">
            <ClipboardList className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No tenés evaluaciones activas.</p>
            <p className="text-xs text-muted-foreground">Solicitá una para comenzar el Protocolo V3.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(ev => (
              <EvalCard key={ev.id} ev={ev} onUpload={setUploadTarget} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
