'use client'

import { useState, useTransition } from 'react'
import {
  ClipboardList, Plus, Calendar, CreditCard, CheckCircle,
  Clock, Upload, X, AlertCircle, Copy, Check,
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

function formatScheduled(date: string | null, time: string | null) {
  if (!date) return null
  const d = new Date(`${date}T${time ?? '00:00'}`)
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
    (time ? ` a las ${time.slice(0, 5)}` : '')
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center gap-1 text-[10px] text-[#00C4CC] hover:underline"
      title="Copiar"
    >
      {copied
        ? <><Check className="h-3 w-3" /> Copiado</>
        : <><Copy className="h-3 w-3" /> Copiar</>
      }
    </button>
  )
}

// ─── Payment Card (inline, para scheduled) ────────────────────────────────────

function PaymentCard({ ev }: { ev: EvaluationSummary }) {
  const [state, setState]     = useState<EvaluationFlowState>({ error: null })
  const [isPending, startTransition] = useTransition()
  const [fileName, setFileName]       = useState<string>('')

  const scheduled = formatScheduled(ev.scheduledDate, ev.scheduledTime)
  const amount    = ev.paymentAmount
    ? `$${Number(ev.paymentAmount).toLocaleString('es-CO')}`
    : '$270.000'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('evalId', ev.id)
    startTransition(async () => {
      const result = await uploadEvaluationPaymentProofAction({ error: null }, formData)
      setState(result)
    })
  }

  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-blue-500/20">
        <div>
          <p className="text-sm font-semibold text-foreground">{ev.title}</p>
          {scheduled && (
            <p className="text-xs text-blue-400 mt-0.5">{scheduled}</p>
          )}
          {ev.coach && (
            <p className="text-xs text-muted-foreground mt-0.5">Coach: {ev.coach.full_name}</p>
          )}
        </div>
        <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-500/15 text-blue-400">
          Pendiente de pago
        </span>
      </div>

      {/* Amount */}
      <div className="px-4 py-3 border-b border-blue-500/20 flex items-center justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Valor a pagar</p>
        <p className="text-lg font-bold text-foreground tabular-nums">{amount}</p>
      </div>

      {/* Bank details */}
      <div className="px-4 py-3 border-b border-blue-500/20 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos bancarios</p>

        <div className="space-y-2">
          {/* Bancolombia */}
          <div className="rounded-md bg-card border border-border px-3 py-2">
            <p className="text-[11px] font-semibold text-foreground">Bancolombia</p>
            <p className="text-xs text-muted-foreground">Cuenta de Ahorros</p>
            <div className="flex items-center mt-0.5">
              <span className="text-sm font-mono font-semibold text-foreground">876-000008-69</span>
              <CopyButton text="87600000869" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">A nombre de: Juan Sebastián Sedano</p>
          </div>

          {/* Nequi / Bre-B */}
          <div className="rounded-md bg-card border border-border px-3 py-2">
            <p className="text-[11px] font-semibold text-foreground">Bre-B / Nequi</p>
            <div className="flex items-center mt-0.5">
              <span className="text-sm font-mono font-semibold text-foreground">301 657 5440</span>
              <CopyButton text="3016575440" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">A nombre de: Juan Sebastián Sedano</p>
          </div>
        </div>
      </div>

      {/* Upload proof */}
      <form onSubmit={handleSubmit} className="px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comprobante de pago</p>
        <label className={`flex items-center gap-3 border-2 border-dashed rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
          fileName ? 'border-[#00C4CC]/50 bg-[#00C4CC]/5' : 'border-border hover:border-primary/40'
        }`}>
          <Upload className={`h-4 w-4 shrink-0 ${fileName ? 'text-[#00C4CC]' : 'text-muted-foreground'}`} />
          <span className="text-xs text-muted-foreground truncate">
            {fileName || 'Seleccionar imagen o PDF (máx. 5 MB)'}
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

        {state.error && <p className="text-xs text-red-400">{state.error}</p>}
        {state.success && <p className="text-xs text-emerald-500">{state.success}</p>}

        <Button
          type="submit"
          size="sm"
          disabled={isPending || !fileName}
          className="w-full gap-2"
        >
          <Upload className="h-3 w-3" />
          {isPending ? 'Enviando…' : 'Enviar comprobante'}
        </Button>
      </form>
    </div>
  )
}

// ─── Request Evaluation Modal ─────────────────────────────────────────────────

function RequestModal({ onClose }: { onClose: () => void }) {
  const [state, setState]            = useState<EvaluationFlowState>({ error: null })
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          El administrador revisará tu solicitud y la agendará. El costo del Protocolo V3 es{' '}
          <strong>$270.000</strong>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs">Descripción (opcional)</Label>
            <Input
              name="title"
              placeholder="Ej: Evaluación junio 2026"
              defaultValue={`Evaluación Protocolo V3 – ${new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`}
            />
          </div>
          {state.error && <p className="text-xs text-red-400">{state.error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="flex-1">
              {isPending ? 'Enviando…' : 'Solicitar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Evaluation Card ──────────────────────────────────────────────────────────

function EvalCard({ ev }: { ev: EvaluationSummary }) {
  if (ev.evaluationStatus === 'scheduled') {
    return <PaymentCard ev={ev} />
  }

  const Icon = STATUS_ICON[ev.evaluationStatus]

  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-start gap-3">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${STATUS_COLOR[ev.evaluationStatus].split(' ')[1]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{ev.title}</p>
          {ev.scheduledDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatScheduled(ev.scheduledDate, ev.scheduledTime)}
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

      <div className={`flex items-center gap-2 text-xs border-t border-border pt-2 ${
        ev.evaluationStatus === 'confirmed' ? 'text-emerald-500' : 'text-muted-foreground'
      }`}>
        {ev.evaluationStatus === 'requested' && (
          <><Clock className="h-3 w-3 shrink-0" /> Esperando que el administrador agende la fecha</>
        )}
        {ev.evaluationStatus === 'payment_pending' && (
          <><AlertCircle className="h-3 w-3 shrink-0" /> Comprobante enviado — esperando confirmación del administrador</>
        )}
        {ev.evaluationStatus === 'confirmed' && (
          <><CheckCircle className="h-3 w-3 shrink-0" /> Pago confirmado — evaluación lista para realizarse</>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlayerEvalPanel({ pendingEvals }: { pendingEvals: EvaluationSummary[] }) {
  const [showRequest, setShowRequest] = useState(false)

  const active = pendingEvals.filter(e => e.evaluationStatus !== 'completed')

  return (
    <>
      {showRequest && <RequestModal onClose={() => setShowRequest(false)} />}

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
            {active.map(ev => <EvalCard key={ev.id} ev={ev} />)}
          </div>
        )}
      </div>
    </>
  )
}
