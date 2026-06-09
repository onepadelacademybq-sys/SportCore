import type { Metadata } from 'next'
import {
  getFinancialDashboard,
  getIncomes,
  getExpenses,
  getBankAccounts,
} from '@/actions/finances'
import { FinancesClient } from '@/components/finances/finances-client'

export const metadata: Metadata = { title: 'Finanzas — Admin' }

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function monthLabel(month: string) {
  const [year, mm] = month.split('-')
  return `${MONTH_NAMES[Number(mm) - 1]} ${year}`
}

export default async function AdminFinancesPage() {
  const [dashboard, incomes, expenses, accounts] = await Promise.all([
    getFinancialDashboard(),
    getIncomes(),
    getExpenses(),
    getBankAccounts(),
  ])

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Finanzas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ingresos, egresos y cuentas · {monthLabel(dashboard.month)}
        </p>
      </div>

      <FinancesClient
        dashboard={dashboard}
        incomes={incomes}
        expenses={expenses}
        accounts={accounts}
      />
    </div>
  )
}
