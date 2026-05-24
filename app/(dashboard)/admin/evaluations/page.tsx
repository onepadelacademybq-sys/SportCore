import type { Metadata } from 'next'
import { getAllEvaluations, getPlayers } from '@/actions/evaluations'
import { EvalList } from '@/components/evaluations/eval-list'

export const metadata: Metadata = { title: 'Evaluaciones' }

export default async function AdminEvaluationsPage() {
  const [evaluations, players] = await Promise.all([getAllEvaluations(), getPlayers()])

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Evaluaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión de evaluaciones del Protocolo V3
        </p>
      </div>

      <EvalList evaluations={evaluations} role="admin" players={players} />
    </div>
  )
}
