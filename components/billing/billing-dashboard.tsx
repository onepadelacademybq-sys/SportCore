'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Zap, CheckCircle, AlertTriangle, XCircle, ArrowRight, Settings, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  createCheckoutSessionAction,
  openBillingPortalAction,
  PLAN_DISPLAY,
  type BillingStatus,
} from '@/actions/billing'
import type { BillingModality } from '@/lib/stripe/client'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  trialing: {
    label: 'Período de prueba',
    icon:  TrendingUp,
    cls:   'bg-blue-500/10 text-blue-600 border-blue-200',
  },
  active: {
    label: 'Activo',
    icon:  CheckCircle,
    cls:   'bg-green-500/10 text-green-600 border-green-200',
  },
  suspended: {
    label: 'Suspendido',
    icon:  AlertTriangle,
    cls:   'bg-orange-500/10 text-orange-600 border-orange-200',
  },
  cancelled: {
    label: 'Cancelado',
    icon:  XCircle,
    cls:   'bg-red-500/10 text-red-600 border-red-200',
  },
}

const MODALITY_LABELS: Record<BillingModality, string> = {
  monthly:   'Mensual',
  quarterly: 'Trimestral',
  deferred:  'Anual diferido',
  annual:    'Anual contado',
}

const MODALITY_SUBLABELS: Record<BillingModality, string> = {
  monthly:   'Sin compromiso',
  quarterly: '15% off',
  deferred:  '18% EA · 12 cuotas',
  annual:    '2 meses gratis',
}

function UsageBar({
  label,
  current,
  limit,
}: {
  label: string
  current: number
  limit: number
}) {
  const pct     = limit === 0 ? 100 : Math.min((current / limit) * 100, 100)
  const isWarn  = pct >= 80
  const isFull  = pct >= 100

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold tabular-nums ${isFull ? 'text-red-500' : isWarn ? 'text-orange-500' : 'text-foreground'}`}>
          {current} / {limit === 99 || limit === 999 ? '∞' : limit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isFull ? 'bg-red-500' : isWarn ? 'bg-orange-400' : 'bg-primary'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  billing:   BillingStatus
  success?:  boolean
  cancelled?: boolean
}

export function BillingDashboard({ billing, success, cancelled }: Props) {
  const [modality, setModality]   = useState<BillingModality>('monthly')
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const router = useRouter()

  const statusCfg = STATUS_CONFIG[billing.status]
  const StatusIcon = statusCfg.icon
  const isSuspended = billing.status === 'suspended' || billing.status === 'cancelled'

  function handleUpgrade(plan: 'starter' | 'pro' | 'enterprise') {
    setActionError(null)
    startTransition(async () => {
      const result = await createCheckoutSessionAction(plan, modality)
      if (result && 'error' in result) setActionError(result.error)
    })
  }

  function handlePortal() {
    setActionError(null)
    startTransition(async () => {
      const result = await openBillingPortalAction()
      if (result && 'error' in result) setActionError(result.error)
    })
  }

  const planOrder: Array<'starter' | 'pro' | 'enterprise'> = ['starter', 'pro', 'enterprise']

  return (
    <div className="space-y-8">

      {/* ── Flash messages ──────────────────────────────────────────────── */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">¡Suscripción activada! Tu plan ya está activo.</span>
        </div>
      )}
      {cancelled && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted border text-muted-foreground">
          <XCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">Pago cancelado. Puedes intentarlo de nuevo cuando quieras.</span>
        </div>
      )}
      {isSuspended && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">
              {billing.status === 'suspended' ? 'Cuenta suspendida por fallo de pago.' : 'Suscripción cancelada.'}
            </p>
            <p className="text-orange-600 mt-0.5">Activa un plan para restaurar el acceso completo.</p>
          </div>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <XCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{actionError}</span>
        </div>
      )}

      {/* ── Current plan status ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Plan card */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Plan actual</p>
              <h2 className="text-2xl font-bold">
                {PLAN_DISPLAY[billing.plan]?.name ?? billing.plan}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {PLAN_DISPLAY[billing.plan]?.limits}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${statusCfg.cls}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </div>
          </div>

          {billing.trialEndsAt && billing.status === 'trialing' && (
            <div className="text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              Prueba gratuita hasta el{' '}
              <span className="font-semibold">
                {new Date(billing.trialEndsAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          {billing.planExpiresAt && billing.status === 'active' && (
            <p className="text-sm text-muted-foreground">
              Próxima renovación:{' '}
              <span className="font-medium text-foreground">
                {new Date(billing.planExpiresAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </p>
          )}

          {billing.stripeSubId && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled={isPending}
              onClick={handlePortal}
            >
              <Settings className="h-4 w-4" />
              Gestionar suscripción
            </Button>
          )}
        </div>

        {/* Usage card */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Uso actual</p>
          <div className="space-y-4">
            <UsageBar
              label="Espacios / Recursos"
              current={billing.usage.resources.current}
              limit={billing.limits.max_resources}
            />
            <UsageBar
              label="Miembros activos"
              current={billing.usage.members.current}
              limit={billing.limits.max_members}
            />
            <UsageBar
              label="Coaches"
              current={billing.usage.coaches.current}
              limit={billing.limits.max_coaches}
            />
          </div>
          {(billing.usage.resources.current >= billing.limits.max_resources ||
            billing.usage.members.current >= billing.limits.max_members ||
            billing.usage.coaches.current >= billing.limits.max_coaches) && (
            <p className="text-xs text-orange-600 font-medium">
              Has alcanzado el límite de tu plan. Actualiza para continuar creciendo.
            </p>
          )}
        </div>
      </div>

      {/* ── Modality selector ───────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold mb-3">Modalidad de pago</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.keys(MODALITY_LABELS) as BillingModality[]).map((m) => (
            <button
              key={m}
              onClick={() => setModality(m)}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                modality === m
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <span className="text-sm font-semibold">{MODALITY_LABELS[m]}</span>
              <span className={`text-xs mt-0.5 ${modality === m ? 'text-primary' : 'text-muted-foreground'}`}>
                {MODALITY_SUBLABELS[m]}
              </span>
            </button>
          ))}
        </div>
        {modality === 'deferred' && (
          <p className="text-xs text-muted-foreground mt-2">
            Contrato anual pagado en 12 cuotas mensuales con tasa del 18% EA (1.39% mensual).
            Por debajo del interés de usura vigente. Total final incluye intereses.
          </p>
        )}
      </div>

      {/* ── Plan cards ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold mb-3">Selecciona tu plan</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planOrder.map((plan) => {
            const info    = PLAN_DISPLAY[plan]
            const price   = info.prices[modality]
            const saving  = modality !== 'monthly' ? (info.savings as Record<string, string>)[modality] : null
            const isCurrent = billing.plan === plan && billing.status === 'active'
            const isFeatured = plan === 'pro'

            return (
              <div
                key={plan}
                className={`relative rounded-xl border bg-card p-5 flex flex-col gap-4 transition-shadow ${
                  isFeatured ? 'border-primary shadow-md shadow-primary/10' : ''
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                    Más popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-4 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                    Plan actual
                  </span>
                )}

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{info.name}</p>
                  <p className="font-bold text-xl">{price.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{price.billing}</p>
                  {saving && (
                    <p className="text-xs font-semibold text-green-600 mt-1">Ahorras {saving} vs mensual</p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{info.limits}</p>

                <Button
                  size="sm"
                  variant={isCurrent ? 'outline' : isFeatured ? 'default' : 'outline'}
                  className="w-full gap-2 mt-auto"
                  disabled={isPending || (isCurrent && billing.status === 'active')}
                  onClick={() => handleUpgrade(plan)}
                >
                  {isCurrent && billing.status === 'active' ? (
                    'Plan actual'
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      {billing.plan === 'starter' && plan !== 'starter' ? 'Actualizar' :
                       billing.plan === 'pro'     && plan === 'enterprise' ? 'Actualizar' :
                       billing.status !== 'active' ? 'Activar plan' : 'Cambiar plan'}
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Fine print ──────────────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground text-center">
        Precios en USD · Referencia COP actualizada trimestralmente según TRM Banco de la República.
        Puedes cancelar en cualquier momento desde el portal de facturación.
        El plan diferido está sujeto a contrato anual (Ley 1480/2011).
      </p>
    </div>
  )
}
