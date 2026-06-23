'use client'

import { useState, useTransition } from 'react'
import {
  updateOrgPlan,
  updateOrgStatus,
  type OrgRow,
  type SuperAdminMetrics,
} from '@/actions/superadmin'

// ── Constants ────────────────────────────────────────────────────────────────

const PLAN_LABEL: Record<string, string> = {
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Club',
}

const PLAN_CLS: Record<string, string> = {
  starter:    'bg-slate-500/15 text-slate-300',
  pro:        'bg-blue-500/15 text-blue-400',
  enterprise: 'bg-purple-500/15 text-purple-400',
}

const STATUS_CLS: Record<string, string> = {
  trialing:  'bg-sky-500/15 text-sky-400',
  active:    'bg-emerald-500/15 text-emerald-400',
  suspended: 'bg-orange-500/15 text-orange-400',
  cancelled: 'bg-red-500/15 text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  trialing:  'Trial',
  active:    'Activo',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${accent ?? ''}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

// ── Org table row ─────────────────────────────────────────────────────────────

function OrgTableRow({ org }: { org: OrgRow }) {
  const [isPending, startTransition] = useTransition()
  const [rowError, setRowError]     = useState<string | null>(null)

  function handlePlan(plan: string) {
    setRowError(null)
    startTransition(async () => {
      const result = await updateOrgPlan(org.id, plan)
      if (result.error) setRowError(result.error)
    })
  }

  function handleStatus(status: string) {
    setRowError(null)
    startTransition(async () => {
      const result = await updateOrgStatus(org.id, status)
      if (result.error) setRowError(result.error)
    })
  }

  const created = new Date(org.createdAt).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: '2-digit',
  })

  const expiry = org.trialEndsAt ?? org.planExpiresAt
  const expiryLabel = expiry
    ? new Date(expiry).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })
    : '—'

  return (
    <tr className={`border-b last:border-0 transition-opacity hover:bg-muted/30 ${isPending ? 'opacity-50' : ''}`}>
      {/* Name + slug */}
      <td className="py-3 pr-4 pl-4 min-w-[180px]">
        <p className="font-semibold text-sm leading-tight">{org.name}</p>
        <p className="text-xs text-muted-foreground">{org.slug}</p>
        {rowError && (
          <p className="text-xs text-red-500 mt-0.5">{rowError}</p>
        )}
      </td>

      {/* Sport */}
      <td className="py-3 pr-4 text-sm text-muted-foreground capitalize">{org.sport}</td>

      {/* Plan */}
      <td className="py-3 pr-4">
        <select
          value={org.plan}
          onChange={(e) => handlePlan(e.target.value)}
          disabled={isPending}
          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer appearance-none pr-5 ${PLAN_CLS[org.plan]}`}
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}
        >
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Club</option>
        </select>
      </td>

      {/* Status */}
      <td className="py-3 pr-4">
        <select
          value={org.status}
          onChange={(e) => handleStatus(e.target.value)}
          disabled={isPending}
          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer appearance-none pr-5 ${STATUS_CLS[org.status]}`}
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}
        >
          <option value="trialing">Trial</option>
          <option value="active">Activo</option>
          <option value="suspended">Suspendido</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </td>

      {/* Members / Coaches */}
      <td className="py-3 pr-4 text-sm tabular-nums text-center">{org.members}</td>
      <td className="py-3 pr-4 text-sm tabular-nums text-center">{org.coaches}</td>

      {/* Expiry */}
      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{expiryLabel}</td>

      {/* Created */}
      <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">{created}</td>

      {/* Stripe */}
      <td className="py-3 pl-4 text-center">
        {org.stripeSubId ? (
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" title={org.stripeSubId} />
        ) : (
          <span className="inline-block h-2 w-2 rounded-full bg-muted" title="Sin suscripción Stripe" />
        )}
      </td>
    </tr>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────

interface Props {
  orgs:    OrgRow[]
  metrics: SuperAdminMetrics
}

export function SuperAdminDashboard({ orgs, metrics }: Props) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPlan,   setFilterPlan]   = useState<string>('all')

  const filtered = orgs.filter((o) => {
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    const matchPlan   = filterPlan   === 'all' || o.plan   === filterPlan
    return matchSearch && matchStatus && matchPlan
  })

  return (
    <div className="space-y-8">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold">Tenants SportCore</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestión global de organizaciones · {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Metrics ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Orgs totales"
          value={metrics.total}
          sub={`${metrics.byStatus.trialing ?? 0} en trial · ${metrics.byStatus.suspended ?? 0} suspendidas`}
        />
        <MetricCard
          label="MRR estimado"
          value={`$${metrics.mrr.toLocaleString()}`}
          sub={`${metrics.byStatus.active ?? 0} activas · base mensual`}
          accent="text-green-600"
        />
        <MetricCard
          label="Plan mix"
          value={`${metrics.byPlan.starter ?? 0} / ${metrics.byPlan.pro ?? 0} / ${metrics.byPlan.enterprise ?? 0}`}
          sub="Starter · Pro · Club"
        />
        <MetricCard
          label="Conversión trial"
          value={
            metrics.total > 0
              ? `${Math.round(((metrics.byStatus.active ?? 0) / metrics.total) * 100)}%`
              : '—'
          }
          sub={`${metrics.byStatus.active ?? 0} activas de ${metrics.total} total`}
          accent={(metrics.byStatus.active ?? 0) / (metrics.total || 1) >= 0.3 ? 'text-green-600' : 'text-orange-500'}
        />
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar org o slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 w-56"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">Todos los estados</option>
          <option value="trialing">Trial</option>
          <option value="active">Activo</option>
          <option value="suspended">Suspendido</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="h-8 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">Todos los planes</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Club</option>
        </select>
        {filtered.length !== orgs.length && (
          <span className="text-xs text-muted-foreground">{filtered.length} de {orgs.length}</span>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="py-3 pr-4 pl-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organización</th>
              <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deporte</th>
              <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</th>
              <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
              <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Mbrs</th>
              <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Coaches</th>
              <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expira</th>
              <th className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creado</th>
              <th className="py-3 pl-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Stripe</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                  No hay organizaciones que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              filtered.map((org) => (
                <OrgTableRow key={org.id} org={org} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Los cambios de plan y estado se aplican inmediatamente · MRR calculado con precio mensual base sin descuentos
      </p>
    </div>
  )
}
