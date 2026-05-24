import type { Metadata } from 'next'
import { getAllEvaluations, getPlayers } from '@/actions/evaluations'
import { EvalList } from '@/components/evaluations/eval-list'

export const metadata: Metadata = { title: 'Evaluaciones' }

export default async function AdminEvaluationsPage() {
  let evaluations: Awaited<ReturnType<typeof getAllEvaluations>> = []
  let players: Awaited<ReturnType<typeof getPlayers>> = []
  let debugError: string | null = null

  try {
    ;[evaluations, players] = await Promise.all([getAllEvaluations(), getPlayers()])
  } catch (e) {
    debugError = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack}` : String(e)
  }

  if (debugError) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error en /admin/evaluaciones</h1>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">{debugError}</pre>
      </div>
    )
  }

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
