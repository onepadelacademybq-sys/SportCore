import type { Metadata } from 'next'
import { getReportData } from '@/actions/reports'
import { ReportsDashboard } from '@/components/reports/reports-dashboard'

export const metadata: Metadata = { title: 'Reportes — Admin' }

export default async function AdminReportsPage() {
  const data = await getReportData()

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Analítica de finanzas, estudiantes y CRM — {data.currentMonthLabel}
        </p>
      </div>

      <ReportsDashboard data={data} />
    </div>
  )
}
