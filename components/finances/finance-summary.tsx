'use client'

import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { formatCOP } from '@/lib/format'
import { CATEGORY_LABELS } from '@/lib/finances/labels'
import type { FinancialDashboard } from '@/actions/finances'

function KpiCard({
  label, value, icon, accent,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums mt-1 ${accent}`}>{value}</p>
    </div>
  )
}

export function FinanceSummary({ data }: { data: FinancialDashboard }) {
  const { monthIncome, monthExpense, netProfit, cashFlowByWeek, incomeByCategory, expenseByCategory } = data

  const maxFlow = Math.max(
    1,
    ...cashFlowByWeek.map((w) => Math.max(w.income, w.expense)),
  )

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          label="Ingresos del mes"
          value={formatCOP(monthIncome)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="text-emerald-500"
        />
        <KpiCard
          label="Egresos del mes"
          value={formatCOP(monthExpense)}
          icon={<TrendingDown className="h-4 w-4" />}
          accent="text-red-400"
        />
        <KpiCard
          label="Utilidad neta"
          value={formatCOP(netProfit)}
          icon={<Wallet className="h-4 w-4" />}
          accent={netProfit >= 0 ? 'text-brand' : 'text-red-400'}
        />
      </div>

      {/* Flujo de caja semanal */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-4">Flujo de caja semanal</h3>
        <div className="flex items-end gap-4 h-44">
          {cashFlowByWeek.map((w) => (
            <div key={w.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="flex items-end gap-1 h-full w-full justify-center">
                <div
                  className="w-1/3 max-w-8 rounded-t bg-emerald-500/70"
                  style={{ height: `${(w.income / maxFlow) * 100}%` }}
                  title={`Ingresos: ${formatCOP(w.income)}`}
                />
                <div
                  className="w-1/3 max-w-8 rounded-t bg-red-400/70"
                  style={{ height: `${(w.expense / maxFlow) * 100}%` }}
                  title={`Egresos: ${formatCOP(w.expense)}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{w.label}</span>
              <span className={`text-[10px] font-medium tabular-nums ${w.net >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {w.net >= 0 ? '+' : ''}{formatCOP(w.net)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500/70" /> Ingresos</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400/70" /> Egresos</span>
        </div>
      </div>

      {/* Desglose por categoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CategoryBreakdown title="Ingresos por categoría" items={incomeByCategory} accent="text-emerald-500" />
        <CategoryBreakdown title="Egresos por categoría" items={expenseByCategory} accent="text-red-400" />
      </div>
    </div>
  )
}

function CategoryBreakdown({
  title, items, accent,
}: {
  title: string
  items: { category: string; total: number }[]
  accent: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin movimientos este mes.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.category} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {CATEGORY_LABELS[it.category as keyof typeof CATEGORY_LABELS] ?? it.category}
              </span>
              <span className={`font-medium tabular-nums ${accent}`}>{formatCOP(it.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
