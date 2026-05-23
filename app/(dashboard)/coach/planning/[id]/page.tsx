import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { getMesocycleById, getAssignmentTargets, changeMesocycleStatusAction, updateMicrocycleAction, getConfirmedBookingsForAssignment } from '@/actions/training'
import { MesoStatusBadge, SessionStatusBadge } from '@/components/training/status-badge'
import { AssignForm } from '@/components/training/assign-form'
import { SessionForm } from '@/components/training/session-form'
import { MicrocycleTypePicker } from '@/components/training/microcycle-type-picker'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Mesociclo — Entrenador' }

const LEVEL_LABELS: Record<string, string> = {
  '5ta_masculino': '5ta Masculino', '6ta_masculino': '6ta Masculino', '7ma_masculino': '7ma Masculino',
  femenino_d: 'Femenino D', femenino_c: 'Femenino C',
  juvenil_s18: 'Juvenil S18', juvenil_s16: 'Juvenil S16', juvenil_s14: 'Juvenil S14',
  prejuvenil: 'Prejuvenil', baby_padel: 'Baby Pádel',
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  if (status === 'cancelled') return <XCircle className="h-4 w-4 text-red-400" />
  return <Clock className="h-4 w-4 text-amber-400" />
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function CoachMesocycleDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab } = await searchParams

  const [mesocycle, targets] = await Promise.all([
    getMesocycleById(id),
    getAssignmentTargets(),
  ])

  if (!mesocycle) notFound()

  const playerIds = mesocycle.assignments.flatMap((a) => a.player_id ? [a.player_id] : [])
  const groupIds  = mesocycle.assignments.flatMap((a) => a.group_id  ? [a.group_id]  : [])
  const confirmedBookings = await getConfirmedBookingsForAssignment(playerIds, groupIds)
  const hasPlayerAssignment = playerIds.length > 0

  const showAssign = tab === 'assign'

  const STATUS_TRANSITIONS: Record<string, { next: string; label: string }> = {
    draft:     { next: 'active',    label: 'Activar' },
    active:    { next: 'completed', label: 'Completar' },
    completed: { next: 'archived',  label: 'Archivar' },
    archived:  { next: 'draft',     label: 'Reactivar como borrador' },
  }
  const transition = STATUS_TRANSITIONS[mesocycle.status]

  const totalSessions = mesocycle.microcycles.flatMap((mc) => mc.sessions).length
  const doneSessions  = mesocycle.microcycles.flatMap((mc) => mc.sessions).filter((s) => s.status === 'completed').length

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <Link
        href="/coach/planning"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Planificación
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <MesoStatusBadge status={mesocycle.status} />
            <span className="text-xs text-muted-foreground">
              {LEVEL_LABELS[mesocycle.level] ?? mesocycle.level} · {mesocycle.duration_weeks} semanas
            </span>
          </div>
          <h1 className="text-2xl font-bold">{mesocycle.name}</h1>
          <p className="text-sm text-muted-foreground">{mesocycle.general_objective}</p>
        </div>

        {transition && (
          <form action={changeMesocycleStatusAction}>
            <input type="hidden" name="mesocycleId" value={mesocycle.id} />
            <input type="hidden" name="status" value={transition.next} />
            <Button type="submit" variant="outline" size="sm">{transition.label}</Button>
          </form>
        )}
      </div>

      {totalSessions > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sesiones totales', value: totalSessions },
            { label: 'Completadas', value: doneSessions },
            { label: 'Pendientes', value: totalSessions - doneSessions },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-border">
        {([
          { key: '',       label: 'Semanas' },
          { key: 'assign', label: `Asignaciones (${mesocycle.assignments.length})` },
        ] as const).map((t) => (
          <Link
            key={t.key}
            href={`/coach/planning/${id}${t.key ? `?tab=${t.key}` : ''}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              (t.key === 'assign' ? showAssign : !showAssign)
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {showAssign ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Asignar a jugadores o grupos</h2>
          <AssignForm
            mesocycleId={mesocycle.id}
            assignments={mesocycle.assignments}
            players={targets.players}
            groups={targets.groups}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {mesocycle.microcycles.map((mc) => (
            <details key={mc.id} className="group rounded-xl border border-border bg-card" open>
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none">
                <div>
                  <span className="font-semibold">Semana {mc.week_number}</span>
                  {mc.weekly_objective && (
                    <span className="text-sm text-muted-foreground ml-3">{mc.weekly_objective}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {mc.sessions.length} sesión{mc.sessions.length !== 1 ? 'es' : ''}
                </span>
              </summary>

              <div className="border-t border-border px-5 py-4 space-y-4">
                {/* Microcycle type picker */}
                <details className="rounded-lg border border-border">
                  <summary className="px-4 py-2.5 cursor-pointer text-sm font-medium list-none hover:bg-muted/40 transition-colors">
                    Tipo de microciclo{mc.weekly_objective ? ` — ${mc.weekly_objective}` : ''}
                  </summary>
                  <div className="px-4 py-3 border-t border-border">
                    <MicrocycleTypePicker
                      microcycleId={mc.id}
                      currentObjective={mc.weekly_objective ?? null}
                      action={updateMicrocycleAction}
                    />
                  </div>
                </details>

                {mc.sessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/coach/planning/${id}/session/${s.id}`}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon status={s.status} />
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(s.scheduled_at).toLocaleDateString('es-AR', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })}
                          {' '}
                          {new Date(s.scheduled_at).toLocaleTimeString('es-AR', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.duration_min} min · {s.blocks.reduce((n, b) => n + b.exercises.length, 0)} ejercicios
                        </p>
                      </div>
                    </div>
                    <SessionStatusBadge status={s.status} />
                  </Link>
                ))}

                <details className="rounded-lg border border-dashed border-border">
                  <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground list-none">
                    <Plus className="h-3.5 w-3.5" />
                    Nueva sesión en semana {mc.week_number}
                  </summary>
                  <div className="px-4 py-3 border-t border-border">
                    <SessionForm microcycleId={mc.id} confirmedBookings={confirmedBookings} hasPlayerAssignment={hasPlayerAssignment} />
                  </div>
                </details>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
