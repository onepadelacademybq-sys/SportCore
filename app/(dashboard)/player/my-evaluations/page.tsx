import type { Metadata } from 'next'
import { ClipboardList } from 'lucide-react'
import { getPlayerEvaluations, getDashboardData } from '@/actions/evaluations'
import { EvalDashboard } from '@/components/evaluations/eval-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Mis Evaluaciones' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function PlayerMyEvaluationsPage() {
  const evaluations = await getPlayerEvaluations()
  const shared      = evaluations.filter((e) => e.isShared)

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Mis Evaluaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resultados del Protocolo V3 compartidos por tu entrenador
        </p>
      </div>

      {shared.length === 0 && (
        <div className="rounded-lg border border-border p-12 text-center space-y-2">
          <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Aún no tenés evaluaciones compartidas.
          </p>
          <p className="text-xs text-muted-foreground">
            Tu entrenador las compartirá cuando estén listas.
          </p>
        </div>
      )}

      {shared.map((evaluation) => (
        <EvalCard
          key={evaluation.id}
          evaluationId={evaluation.id}
          title={evaluation.title}
          evaluatedAt={evaluation.evaluatedAt}
          coachName={evaluation.coach?.full_name ?? 'Entrenador'}
          notes={evaluation.notes}
        />
      ))}
    </div>
  )
}

async function EvalCard({
  evaluationId, title, evaluatedAt, coachName, notes,
}: {
  evaluationId: string
  title:        string
  evaluatedAt:  string
  coachName:    string
  notes:        string | null
}) {
  const dashboard = await getDashboardData(evaluationId)
  if (!dashboard) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(evaluatedAt)} · Coach: {coachName}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EvalDashboard
          data={dashboard}
          evaluationId={evaluationId}
          notes={notes}
          showFull={false}
        />
      </CardContent>
    </Card>
  )
}
