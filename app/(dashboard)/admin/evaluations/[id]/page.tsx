import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getEvaluation, getDashboardData } from '@/actions/evaluations'
import { EvalDashboard } from '@/components/evaluations/eval-dashboard'
import { ShareButton } from '@/components/evaluations/share-button'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Dashboard de evaluación' }

interface Props {
  params: Promise<{ id: string }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Bogota' })
}

export default async function AdminEvaluationDetailPage({ params }: Props) {
  const { id } = await params
  const [evaluation, dashboard] = await Promise.all([getEvaluation(id), getDashboardData(id)])

  if (!evaluation || !dashboard) notFound()

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Link href="/admin/evaluations">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-1 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Evaluaciones
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{evaluation.title}</h1>
          <p className="text-sm text-muted-foreground">
            {evaluation.player.full_name} · {formatDate(evaluation.evaluatedAt)} · Coach: {evaluation.coach?.full_name ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton evaluationId={id} isShared={evaluation.isShared} />
        </div>
      </div>

      {/* Dashboard */}
      <EvalDashboard
        data={dashboard}
        evaluationId={id}
        notes={evaluation.notes}
        showFull={true}
      />
    </div>
  )
}
