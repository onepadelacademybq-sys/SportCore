import type { Metadata } from 'next'
import { Users, Clock } from 'lucide-react'
import { getGroups, getGroupMembers } from '@/actions/groups'
import { LevelBadge } from '@/components/groups/level-badge'
import { GroupStatusBadge } from '@/components/groups/group-status-badge'

export const metadata: Metadata = { title: 'Mis Grupos — Entrenador' }

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default async function CoachGroupsPage() {
  const groups = await getGroups()

  // Load members for each group in parallel
  const groupsWithMembers = await Promise.all(
    groups.map(async (g) => ({
      ...g,
      members: await getGroupMembers(g.id),
    })),
  )

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Mis Grupos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Grupos de entrenamiento que tienes asignados
        </p>
      </div>

      {groupsWithMembers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground text-sm">No tienes grupos asignados aún.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupsWithMembers.map((g) => {
            const activeMembers   = g.members.filter((m) => m.status === 'active')
            const waitlistMembers = g.members.filter((m) => m.status === 'waitlist')

            return (
              <div key={g.id} className="rounded-lg border border-border bg-card overflow-hidden">
                {/* Group header */}
                <div className="px-5 py-4 border-b border-border bg-muted/20">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-lg">{g.name}</h2>
                        <LevelBadge level={g.level} />
                        <GroupStatusBadge status={g.status} />
                      </div>

                      {/* Schedules */}
                      {g.schedules.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {g.schedules.map((s, i) => (
                            <span key={i} className="text-xs text-muted-foreground">
                              {i > 0 && '·'} {DAY_NAMES[s.day_of_week]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Cupos</p>
                      <p className="font-bold text-lg">
                        {activeMembers.length}
                        <span className="text-muted-foreground font-normal">/{g.max_capacity}</span>
                      </p>
                      {waitlistMembers.length > 0 && (
                        <p className="text-xs text-amber-400">+{waitlistMembers.length} en espera</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active members */}
                {activeMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-5 py-8 text-center">
                    No hay jugadores activos en este grupo.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="px-5 py-2.5 flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Jugadores activos
                      </span>
                    </div>
                    {activeMembers.map((m) => (
                      <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{m.player.full_name}</p>
                          <p className="text-xs text-muted-foreground">{m.player.email}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {m.player.padel_level && (
                            <span className="font-medium text-foreground">{m.player.padel_level}</span>
                          )}
                          <p>Desde {new Date(m.joined_at).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Waitlist */}
                {waitlistMembers.length > 0 && (
                  <div className="border-t border-amber-500/20">
                    <div className="px-5 py-2.5 flex items-center gap-2 bg-amber-500/5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                        Lista de espera
                      </span>
                    </div>
                    {waitlistMembers.map((m, i) => (
                      <div key={m.id} className="px-5 py-3 flex items-center gap-3 border-t border-border/50">
                        <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{m.player.full_name}</p>
                          <p className="text-xs text-muted-foreground">{m.player.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
