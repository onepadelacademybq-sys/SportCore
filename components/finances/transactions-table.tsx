'use client'

import { useMemo, useState } from 'react'
import { formatCOP, formatDate } from '@/lib/format'
import { CATEGORY_LABELS } from '@/lib/finances/labels'
import { Badge } from '@/components/ui/badge'
import type { FinancialTx, FinancialCategory } from '@/actions/finances'

interface Props {
  transactions: FinancialTx[]
  categories: FinancialCategory[]
  emptyLabel: string
}

export function TransactionsTable({ transactions, categories, emptyLabel }: Props) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [category, setCategory] = useState<'all' | FinancialCategory>('all')

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (from && t.date < from) return false
      if (to && t.date > to) return false
      if (category !== 'all' && t.category !== category) return false
      return true
    })
  }, [transactions, from, to, category])

  const total = filtered.reduce((sum, t) => sum + t.amount, 0)
  const isIncome = transactions[0]?.type === 'income'
  const amountColor = isIncome ? 'text-emerald-500' : 'text-red-400'

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Categoría
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as 'all' | FinancialCategory)}
            className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
          >
            <option value="all">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </label>
        {(from || to || category !== 'all') && (
          <button
            onClick={() => { setFrom(''); setTo(''); setCategory('all') }}
            className="h-8 text-xs text-brand hover:underline"
          >
            Limpiar
          </button>
        )}
        <p className="ml-auto text-sm">
          Total: <span className={`font-bold tabular-nums ${amountColor}`}>{formatCOP(total)}</span>
        </p>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <div className="min-w-[520px]">
          <div
            className="grid text-[10px] font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30 px-4 py-2"
            style={{ gridTemplateColumns: '110px 1fr 130px 120px' }}
          >
            <span>Fecha</span>
            <span>Descripción</span>
            <span>Categoría</span>
            <span className="text-right">Monto</span>
          </div>
          {filtered.map((t) => (
            <div
              key={t.id}
              className="grid px-4 py-3 border-t border-border items-center"
              style={{ gridTemplateColumns: '110px 1fr 130px 120px' }}
            >
              <span className="text-xs text-muted-foreground">{formatDate(`${t.date}T12:00:00`)}</span>
              <span className="text-sm truncate pr-3">{t.description}</span>
              <span>
                <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[t.category]}</Badge>
              </span>
              <span className={`text-right text-sm font-semibold tabular-nums ${amountColor}`}>
                {isIncome ? '+' : '−'}{formatCOP(t.amount)}
              </span>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  )
}
