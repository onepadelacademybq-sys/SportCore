import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { EvaluationSummary } from '@/actions/evaluations'

interface Props {
  evaluations: EvaluationSummary[]
  role:        'admin' | 'coach'
  players:     { id: string; full_name: string }[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function EvalList({ evaluations, role, players }: Props) {
  // Group by player
  const byPlayer = evaluations.reduce<Record<string, { name: string; evals: EvaluationSummary[] }>>(
    (acc, e) => {
      const pid = e.player.id
      if (!acc[pid]) acc[pid] = { name: e.player.full_name, evals: [] }
      acc[pid].evals.push(e)
      return acc
    },
    {},
  )

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {evaluations.length} evaluación{evaluations.length !== 1 ? 'es' : ''} en total
        </p>
        <Link href={`/${role}/evaluations/new`}>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva evaluación
          </Button>
        </Link>
      </div>

      {evaluations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No hay evaluaciones registradas.</p>
            <Link href={`/${role}/evaluations/new`}>
              <Button size="sm" variant="outline" className="mt-2">Crear primera evaluación</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {Object.entries(byPlayer).map(([playerId, { name, evals }]) => (
        <div key={playerId} className="space-y-2">
          {/* Player header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#00C4CC]/20 flex items-center justify-center text-[#00C4CC] text-xs font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold">{name}</span>
              <span className="text-xs text-muted-foreground">({evals.length})</span>
            </div>
            <Link href={`/${role}/evaluations/new?player=${playerId}`}>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5">
                <Plus className="h-3 w-3" />
                Evaluar
              </Button>
            </Link>
          </div>

          {/* Evaluations for this player */}
          <div className="space-y-2 pl-2 border-l-2 border-border ml-3">
            {evals.map((e) => (
              <Link key={e.id} href={`/${role}/evaluations/${e.id}`}>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.evaluatedAt)}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    e.isShared
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {e.isShared ? 'Compartida' : 'Borrador'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
