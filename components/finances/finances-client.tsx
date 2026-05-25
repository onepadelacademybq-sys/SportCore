'use client'

import { useState } from 'react'
import { FinanceSummary } from './finance-summary'
import { TransactionsTable } from './transactions-table'
import { ManualExpenseForm } from './manual-expense-form'
import { BankAccountsPanel } from './bank-accounts-panel'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/finances/labels'
import type { FinancialDashboard, FinancialTx, BankAccount } from '@/actions/finances'

type Tab = 'dashboard' | 'incomes' | 'expenses' | 'accounts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'incomes',   label: 'Ingresos' },
  { id: 'expenses',  label: 'Egresos' },
  { id: 'accounts',  label: 'Cuentas bancarias' },
]

interface Props {
  dashboard: FinancialDashboard
  incomes: FinancialTx[]
  expenses: FinancialTx[]
  accounts: BankAccount[]
}

export function FinancesClient({ dashboard, incomes, expenses, accounts }: Props) {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-[#00C4CC] text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <FinanceSummary data={dashboard} />}

      {tab === 'incomes' && (
        <TransactionsTable
          transactions={incomes}
          categories={INCOME_CATEGORIES}
          emptyLabel="No hay ingresos en el rango seleccionado."
        />
      )}

      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <ManualExpenseForm accounts={accounts} />
          </div>
          <TransactionsTable
            transactions={expenses}
            categories={EXPENSE_CATEGORIES}
            emptyLabel="No hay egresos en el rango seleccionado."
          />
        </div>
      )}

      {tab === 'accounts' && <BankAccountsPanel accounts={accounts} />}
    </div>
  )
}
