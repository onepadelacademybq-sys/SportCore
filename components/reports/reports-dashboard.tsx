'use client'

import { useState } from 'react'
import {
  TrendingUp, TrendingDown, Users, CalendarDays,
  Wallet, UserCheck, Target, BarChart2,
} from 'lucide-react'
import { formatCOP } from '@/lib/format'
import type { ReportData } from '@/actions/reports'

// ── Label maps ────────────────────────────────────────────────────────────────

const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending:   'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
}

const LEAD_STATUS_LABEL: Record<string, string> = {
  new:             'Nuevo',
  contacted:       'Contactado',
  trial_scheduled: 'Clase agendada',
  trial_done:      'Clase hecha',
  converted:       'Convertido',
  lost:            'Perdido',
}

const LEAD_SOURCE_LABEL: Record<string, string> = {
  web_form:  'Web',
  instagram: 'Instagram',
  facebook:  'Facebook',
  referral:  'Referido',
  walk_in:   'Presencial',
  whatsapp:  'WhatsApp',
  other:     'Otro',
}

const RETENTION_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  active:  { label: 'Activos',     color: 'text-green-400',  bg: 'bg-green-500/10' },
  at_risk: { label: 'En riesgo',   color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  losing:  { label: 'Perdiendo',   color: 'text-orange-400', bg: 'bg-orange-500/10' },
  churned: { label: 'Inactivos',   color: 'text-red-400',    bg: 'bg-red-500/10' },
}

const LEVEL_LABEL: Record<string, string> = {
  iniciacion:  'Iniciación',
  basico:      'Básico',
  intermedio:  'Intermedio',
  avanzado:    'Avanzado',
  competicion: 'Competición',
}

// ── Primitives ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string
  icon: React.ReactNode; accent: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function HBar({ label, value, max, accent, valueStr }: {
  label: string; value: number; max: number; accent: string; valueStr?: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground truncate pr-2">{label}</span>
        <span className={`font-medium tabular-nums shrink-0 ${accent}`}>{valueStr ?? value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${accent.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Trend bar chart (monthly) ─────────────────────────────────────────────────

function MonthlyBars({ data }: { data: ReportData['monthlyTrend'] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)))
  return (
    <div className="flex items-end gap-3 h-36 w-full">
      {data.map((d) => (
        <div key={d.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <div className="flex items-end gap-0.5 h-full w-full justify-center">
            <div
              className="w-2/5 rounded-t bg-emerald-500/70"
              style={{ height: `${(d.income / max) * 100}%`, minHeight: d.income > 0 ? '2px' : '0' }}
              title={`Ingresos: ${formatCOP(d.income)}`}
            />
            <div
              className="w-2/5 rounded-t bg-red-400/60"
              style={{ height: `${(d.expense / max) * 100}%`, minHeight: d.expense > 0 ? '2px' : '0' }}
              title={`Egresos: ${formatCOP(d.expense)}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'resumen',     label: 'Resumen' },
  { id: 'finanzas',    label: 'Finanzas' },
  { id: 'estudiantes', label: 'Estudiantes' },
  { id: 'crm',         label: 'CRM' },
] as const

type TabId = typeof TABS[number]['id']

// ── Main component ────────────────────────────────────────────────────────────

export function ReportsDashboard({ data }: { data: ReportData }) {
  const [tab, setTab] = useState<TabId>('resumen')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen'     && <ResumenTab     data={data} />}
      {tab === 'finanzas'    && <FinanzasTab    data={data} />}
      {tab === 'estudiantes' && <EstudiantesTab data={data} />}
      {tab === 'crm'         && <CrmTab         data={data} />}
    </div>
  )
}

// ── Tab: Resumen ──────────────────────────────────────────────────────────────

function ResumenTab({ data }: { data: ReportData }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Ingresos" value={formatCOP(data.monthIncome)} sub={data.currentMonthLabel}
          icon={<TrendingUp className="h-4 w-4" />} accent="text-emerald-500" />
        <KpiCard label="Egresos" value={formatCOP(data.monthExpense)} sub={data.currentMonthLabel}
          icon={<TrendingDown className="h-4 w-4" />} accent="text-red-400" />
        <KpiCard label="Utilidad neta" value={formatCOP(data.netProfit)}
          icon={<Wallet className="h-4 w-4" />} accent={data.netProfit >= 0 ? 'text-brand' : 'text-red-400'} />
        <KpiCard label="Jugadores activos" value={String(data.activePlayers)} sub={`de ${data.totalPlayers} totales`}
          icon={<Users className="h-4 w-4" />} accent="text-blue-400" />
        <KpiCard label="Reservas este mes" value={String(data.bookingsThisMonth)}
          icon={<CalendarDays className="h-4 w-4" />} accent="text-violet-400" />
        <KpiCard label="Conversión CRM" value={`${data.conversionRate}%`}
          icon={<Target className="h-4 w-4" />} accent="text-amber-400" />
      </div>

      {/* Trend + retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Flujo de caja — últimos 6 meses">
          <MonthlyBars data={data.monthlyTrend} />
          <div className="flex gap-4 text-[10px] text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/70 shrink-0" />Ingresos</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400/60 shrink-0" />Egresos</span>
          </div>
        </SectionCard>

        <SectionCard title="Retención de estudiantes">
          {data.retentionDist.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos de retención. Ejecuta "Recalcular ahora" en el CRM.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(['active','at_risk','losing','churned'] as const).map((k) => {
                const entry = data.retentionDist.find((r) => r.status === k)
                const meta  = RETENTION_LABEL[k]
                return (
                  <div key={k} className={`rounded-lg ${meta.bg} p-3 text-center`}>
                    <p className={`text-2xl font-bold tabular-nums ${meta.color}`}>{entry?.count ?? 0}</p>
                    <p className={`text-xs mt-0.5 ${meta.color}`}>{meta.label}</p>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Bookings by status */}
      <SectionCard title="Reservas por estado (últimos 6 meses)">
        {data.bookingsByStatus.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin reservas en el período.</p>
        ) : (
          <div className="space-y-2.5">
            {data.bookingsByStatus.map((b) => (
              <HBar
                key={b.status}
                label={BOOKING_STATUS_LABEL[b.status] ?? b.status}
                value={b.count}
                max={Math.max(...data.bookingsByStatus.map((x) => x.count))}
                accent="text-violet-400"
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ── Tab: Finanzas ─────────────────────────────────────────────────────────────

function FinanzasTab({ data }: { data: ReportData }) {
  const trend = data.monthlyTrend
  const maxTrend = Math.max(1, ...trend.map((d) => Math.max(d.income, d.expense)))

  return (
    <div className="space-y-6">
      {/* KPIs del mes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label={`Ingresos ${data.currentMonthLabel}`} value={formatCOP(data.monthIncome)}
          icon={<TrendingUp className="h-4 w-4" />} accent="text-emerald-500" />
        <KpiCard label={`Egresos ${data.currentMonthLabel}`} value={formatCOP(data.monthExpense)}
          icon={<TrendingDown className="h-4 w-4" />} accent="text-red-400" />
        <KpiCard label="Utilidad neta" value={formatCOP(data.netProfit)}
          icon={<Wallet className="h-4 w-4" />} accent={data.netProfit >= 0 ? 'text-emerald-500' : 'text-red-400'} />
      </div>

      {/* Monthly chart with net */}
      <SectionCard title="Ingresos vs Egresos — últimos 6 meses">
        <div className="flex items-end gap-3 h-44 w-full">
          {trend.map((d) => (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="flex items-end gap-0.5 h-full w-full justify-center">
                <div className="w-2/5 rounded-t bg-emerald-500/70" style={{ height: `${(d.income / maxTrend) * 100}%`, minHeight: d.income > 0 ? '2px' : '0' }} title={formatCOP(d.income)} />
                <div className="w-2/5 rounded-t bg-red-400/60"    style={{ height: `${(d.expense / maxTrend) * 100}%`, minHeight: d.expense > 0 ? '2px' : '0' }} title={formatCOP(d.expense)} />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
              <span className={`text-[10px] font-medium tabular-nums ${d.net >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {d.net >= 0 ? '+' : ''}{formatCOP(d.net)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-[10px] text-muted-foreground mt-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/70" />Ingresos</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400/60" />Egresos</span>
        </div>
      </SectionCard>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard title={`Ingresos por categoría — ${data.currentMonthLabel}`}>
          {data.incomeByCategory.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin ingresos este mes.</p>
          ) : (
            <div className="space-y-2.5">
              {data.incomeByCategory.map((it) => (
                <HBar key={it.label} label={it.label} value={it.total}
                  max={data.incomeByCategory[0].total} accent="text-emerald-500"
                  valueStr={formatCOP(it.total)} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={`Egresos por categoría — ${data.currentMonthLabel}`}>
          {data.expenseByCategory.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin egresos este mes.</p>
          ) : (
            <div className="space-y-2.5">
              {data.expenseByCategory.map((it) => (
                <HBar key={it.label} label={it.label} value={it.total}
                  max={data.expenseByCategory[0].total} accent="text-red-400"
                  valueStr={formatCOP(it.total)} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

// ── Tab: Estudiantes ──────────────────────────────────────────────────────────

function EstudiantesTab({ data }: { data: ReportData }) {
  const maxNew = Math.max(1, ...data.newPlayersByMonth.map((m) => m.count))
  const maxLevel = Math.max(1, ...data.playersByLevel.map((l) => l.count))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total jugadores"   value={String(data.totalPlayers)}
          icon={<Users className="h-4 w-4" />} accent="text-blue-400" />
        <KpiCard label="Activos" value={String(data.activePlayers)}
          icon={<UserCheck className="h-4 w-4" />} accent="text-emerald-500" />
        <KpiCard label="Inactivos" value={String(data.totalPlayers - data.activePlayers)}
          icon={<Users className="h-4 w-4" />} accent="text-muted-foreground" />
        <KpiCard label="Grupos activos" value={String(data.groups.length)}
          icon={<BarChart2 className="h-4 w-4" />} accent="text-violet-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* New players by month */}
        <SectionCard title="Nuevos jugadores — últimos 6 meses">
          <div className="flex items-end gap-3 h-32 w-full">
            {data.newPlayersByMonth.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-3/4 rounded-t bg-blue-400/70" style={{ height: `${(m.count / maxNew) * 100}%`, minHeight: m.count > 0 ? '2px' : '0' }} title={`${m.count} jugadores`} />
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
                <span className="text-[10px] font-medium text-blue-400">{m.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Level distribution */}
        <SectionCard title="Distribución por nivel">
          {data.playersByLevel.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos de nivel asignado.</p>
          ) : (
            <div className="space-y-2.5">
              {data.playersByLevel.map((l) => (
                <HBar key={l.level} label={LEVEL_LABEL[l.level] ?? l.level}
                  value={l.count} max={maxLevel} accent="text-blue-400" />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Groups occupancy */}
      <SectionCard title="Ocupación de grupos activos">
        {data.groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin grupos activos.</p>
        ) : (
          <div className="space-y-2.5">
            {data.groups.map((g) => {
              const pct = g.capacity > 0 ? Math.round((g.enrolled / g.capacity) * 100) : 0
              const accent = pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-amber-400' : 'text-emerald-500'
              return (
                <HBar key={g.name} label={g.name} value={g.enrolled}
                  max={g.capacity} accent={accent}
                  valueStr={`${g.enrolled}/${g.capacity} (${pct}%)`} />
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ── Tab: CRM ──────────────────────────────────────────────────────────────────

function CrmTab({ data }: { data: ReportData }) {
  const maxStatus = Math.max(1, ...data.leadsByStatus.map((l) => l.count))
  const maxSource = Math.max(1, ...data.leadsBySource.map((l) => l.count))
  const totalLeads = data.leadsByStatus.reduce((s, l) => s + l.count, 0)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total leads"    value={String(totalLeads)}
          icon={<Users className="h-4 w-4" />} accent="text-blue-400" />
        <KpiCard label="Convertidos"    value={String(data.leadsByStatus.find(l => l.status === 'converted')?.count ?? 0)}
          icon={<UserCheck className="h-4 w-4" />} accent="text-emerald-500" />
        <KpiCard label="Tasa de conversión" value={`${data.conversionRate}%`}
          icon={<Target className="h-4 w-4" />} accent="text-amber-400" />
        <KpiCard label="Perdidos"       value={String(data.leadsByStatus.find(l => l.status === 'lost')?.count ?? 0)}
          icon={<TrendingDown className="h-4 w-4" />} accent="text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline by status */}
        <SectionCard title="Pipeline por estado">
          {data.leadsByStatus.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin leads registrados.</p>
          ) : (
            <div className="space-y-2.5">
              {data.leadsByStatus.map((l) => (
                <HBar key={l.status} label={LEAD_STATUS_LABEL[l.status] ?? l.status}
                  value={l.count} max={maxStatus} accent="text-blue-400" />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Source distribution */}
        <SectionCard title="Leads por fuente">
          {data.leadsBySource.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos de fuente.</p>
          ) : (
            <div className="space-y-2.5">
              {data.leadsBySource.map((l) => (
                <HBar key={l.source} label={LEAD_SOURCE_LABEL[l.source] ?? l.source}
                  value={l.count} max={maxSource} accent="text-violet-400" />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Retention */}
      <SectionCard title="Retención de estudiantes">
        {data.retentionDist.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin datos. Ejecuta "Recalcular ahora" en la pestaña CRM del menú.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['active','at_risk','losing','churned'] as const).map((k) => {
              const entry = data.retentionDist.find((r) => r.status === k)
              const meta  = RETENTION_LABEL[k]
              const total = data.retentionDist.reduce((s, r) => s + r.count, 0)
              const pct   = total > 0 ? Math.round(((entry?.count ?? 0) / total) * 100) : 0
              return (
                <div key={k} className={`rounded-xl border ${meta.bg} p-4 text-center`}>
                  <p className={`text-3xl font-bold tabular-nums ${meta.color}`}>{entry?.count ?? 0}</p>
                  <p className={`text-xs font-medium mt-0.5 ${meta.color}`}>{meta.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% del total</p>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
