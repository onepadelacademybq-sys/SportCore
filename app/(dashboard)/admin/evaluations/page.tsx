import type { Metadata } from 'next'
import { getAllEvaluations, getPlayers } from '@/actions/evaluations'
import { getCoaches } from '@/actions/bookings'
import { AdminEvalPanel } from '@/components/evaluations/admin-eval-panel'

export const metadata: Metadata = { title: 'Evaluaciones' }

export default async function AdminEvaluationsPage() {
  const [evaluations, players, coaches] = await Promise.all([
    getAllEvaluations(),
    getPlayers(),
    getCoaches(),
  ])

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Evaluaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión del flujo de evaluaciones — Protocolo V3
        </p>
      </div>

      <AdminEvalPanel evaluations={evaluations} coaches={coaches} players={players} />
    </div>
  )
}
