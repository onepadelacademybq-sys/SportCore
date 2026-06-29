import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getMesocycleById, changeSessionStatusAction, getSessionPlayers } from '@/actions/training'
import { getExercises } from '@/actions/exercises'
import { BlockPanel }         from '@/components/training/block-panel'
import { SessionStatusBadge } from '@/components/training/status-badge'
import { AttendancePanel }    from '@/components/training/attendance-panel'
import { Button } from '@/components/ui/button'
import { formatSessionDate, formatSessionTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Sesión — Entrenador' }

const BLOCK_THEMES: Record<string, string[]> = {
  calentamiento:     ['calentamiento', 'fisico'],
  central:           ['tecnica', 'tactica', 'fisico'],
  vuelta_a_la_calma: ['vuelta_a_la_calma', 'mental'],
}

interface PageProps {
  params: Promise<{ id: string; sessionId: string }>
}

export default async function CoachSessionDetailPage({ params }: PageProps) {
  const { id: mesocycleId, sessionId } = await params

  const [mesocycle, allExercises, sessionPlayers] = await Promise.all([
    getMesocycleById(mesocycleId),
    getExercises(),
    getSessionPlayers(sessionId),
  ])

  if (!mesocycle) notFound()

  const session = mesocycle.microcycles
    .flatMap((mc) => mc.sessions)
    .find((s) => s.id === sessionId)

  if (!session) notFound()

  const microcycle = mesocycle.microcycles.find((mc) =>
    mc.sessions.some((s) => s.id === sessionId),
  )!

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      <Link
        href={`/coach/planning/${mesocycleId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {mesocycle.name} — Semana {microcycle.week_number}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <SessionStatusBadge status={session.status} />
          <h1 className="text-2xl font-bold">
            {formatSessionDate(session.scheduled_at, { long: true, year: true })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatSessionTime(session.scheduled_at)}
            {' · '}{session.duration_min} min
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {session.status !== 'completed' && (
            <form action={changeSessionStatusAction}>
              <input type="hidden" name="sessionId" value={session.id} />
              <input type="hidden" name="status" value="completed" />
              <Button type="submit" size="sm" variant="outline" className="text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10">
                Marcar completada
              </Button>
            </form>
          )}
          {session.status === 'scheduled' && (
            <form action={changeSessionStatusAction}>
              <input type="hidden" name="sessionId" value={session.id} />
              <input type="hidden" name="status" value="cancelled" />
              <Button type="submit" size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                Cancelar
              </Button>
            </form>
          )}
        </div>
      </div>

      {session.coach_notes && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notas</p>
          <p className="text-sm">{session.coach_notes}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {session.blocks.map((block) => {
          const themes = BLOCK_THEMES[block.block_type] ?? []
          const filtered = allExercises.filter((e) => themes.includes(e.theme))
          return (
            <BlockPanel
              key={block.id}
              block={block}
              availableExercises={filtered}
              recommendedTheme={block.block_type === 'central' ? (mesocycle.objective?.theme ?? null) : null}
              objectiveName={block.block_type === 'central' ? (mesocycle.objective?.name ?? null) : null}
            />
          )
        })}
      </div>

      {session.status !== 'cancelled' && (
        <AttendancePanel
          sessionId={session.id}
          players={sessionPlayers.players}
          initialAttendance={sessionPlayers.attendance}
        />
      )}
    </div>
  )
}
