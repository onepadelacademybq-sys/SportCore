import type { Metadata } from 'next'
import { CheckCircle2, XCircle, Clock, BookOpen } from 'lucide-react'
import { getMyMesocycles } from '@/actions/training'
import { MesoStatusBadge, SessionStatusBadge } from '@/components/training/status-badge'
import { BlockPanel } from '@/components/training/block-panel'

export const metadata: Metadata = { title: 'Mis Entrenamientos — Jugador' }

const LEVEL_LABELS: Record<string, string> = {
  '5ta_masculino': '5ta Masculino', '6ta_masculino': '6ta Masculino', '7ma_masculino': '7ma Masculino',
  femenino_d: 'Femenino D', femenino_c: 'Femenino C',
  juvenil_s18: 'Juvenil S18', juvenil_s16: 'Juvenil S16', juvenil_s14: 'Juvenil S14',
  prejuvenil: 'Prejuvenil', baby_padel: 'Baby Pádel',
}

const BLOCK_LABELS: Record<string, string> = {
  calentamiento:     '1. Calentamiento',
  central_1_defensa: '2. Central 1 — Defensa',
  central_2_ataque:  '3. Central 2 — Ataque',
  vuelta_a_la_calma: '4. Vuelta a la calma',
}

function SessionIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
  if (status === 'cancelled') return <XCircle className="h-4 w-4 text-red-400 shrink-0" />
  return <Clock className="h-4 w-4 text-amber-400 shrink-0" />
}

export default async function PlayerMyTrainingsPage() {
  const mesocycles = await getMyMesocycles()

  if (mesocycles.length === 0) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Mis Entrenamientos</h1>
        <p className="text-muted-foreground text-sm mb-12">Tu planificación de entrenamiento asignada</p>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aún no tienes ningún plan de entrenamiento asignado.</p>
          <p className="text-xs text-muted-foreground mt-1">Tu entrenador lo configurará pronto.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mis Entrenamientos</h1>
        <p className="text-muted-foreground text-sm mt-1">Tu planificación de entrenamiento asignada</p>
      </div>

      {mesocycles.map((meso) => {
        const allSessions = meso.microcycles.flatMap((mc) => mc.sessions)
        const done = allSessions.filter((s) => s.status === 'completed').length

        return (
          <div key={meso.id} className="space-y-4">
            {/* Mesocycle header */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MesoStatusBadge status={meso.status} />
                    <span className="text-xs text-muted-foreground">
                      {LEVEL_LABELS[meso.level] ?? meso.level} · {meso.duration_weeks} semanas
                    </span>
                  </div>
                  <h2 className="text-lg font-bold">{meso.name}</h2>
                  <p className="text-sm text-muted-foreground">{meso.general_objective}</p>
                </div>
                {allSessions.length > 0 && (
                  <div className="text-center shrink-0">
                    <p className="text-2xl font-bold">{done}/{allSessions.length}</p>
                    <p className="text-xs text-muted-foreground">sesiones</p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {allSessions.length > 0 && (
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00C4CC] transition-all"
                    style={{ width: `${Math.round((done / allSessions.length) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Microcycles */}
            {meso.microcycles.map((mc) => (
              <details key={mc.id} className="rounded-xl border border-border bg-card">
                <summary className="flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer list-none">
                  <div>
                    <span className="font-semibold text-sm">Semana {mc.week_number}</span>
                    {mc.weekly_objective && (
                      <span className="text-xs text-muted-foreground ml-2">{mc.weekly_objective}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {mc.sessions.filter((s) => s.status === 'completed').length}/{mc.sessions.length} completadas
                    </span>
                  </div>
                </summary>

                <div className="border-t border-border px-5 py-4 space-y-4">
                  {mc.sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin sesiones planificadas aún</p>
                  ) : (
                    mc.sessions.map((session) => (
                      <details key={session.id} className="rounded-lg border border-border">
                        <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none">
                          <SessionIcon status={session.status} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {new Date(session.scheduled_at).toLocaleDateString('es-AR', {
                                weekday: 'long', day: 'numeric', month: 'long',
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.scheduled_at).toLocaleTimeString('es-AR', {
                                hour: '2-digit', minute: '2-digit',
                              })}
                              {' · '}{session.duration_min} min
                            </p>
                          </div>
                          <SessionStatusBadge status={session.status} />
                        </summary>

                        {/* Blocks */}
                        <div className="border-t border-border p-4 space-y-3">
                          {session.coach_notes && (
                            <p className="text-xs text-muted-foreground italic px-1">
                              📝 {session.coach_notes}
                            </p>
                          )}

                          {session.blocks.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Los bloques serán configurados por el entrenador
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {session.blocks.map((block) => (
                                <BlockPanel
                                  key={block.id}
                                  block={block}
                                  availableExercises={[]}
                                  readOnly
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    ))
                  )}
                </div>
              </details>
            ))}
          </div>
        )
      })}
    </div>
  )
}
