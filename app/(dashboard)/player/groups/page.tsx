import type { Metadata } from 'next'
import { Clock } from 'lucide-react'
import { getAvailableGroups, getPlayerGroups } from '@/actions/groups'
import type { GroupSchedule } from '@/actions/groups'
import { LevelBadge } from '@/components/groups/level-badge'
import { JoinGroupButton } from '@/components/groups/join-group-button'

export const metadata: Metadata = { title: 'Grupos de Entrenamiento — Jugador' }

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default async function PlayerGroupsPage() {
  const [availableGroups, myGroups] = await Promise.all([
    getAvailableGroups(),
    getPlayerGroups(),
  ])

  return (
    <div className="p-8 space-y-10 max-w-3xl">
      {/* My current groups */}
      {myGroups.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Mis grupos</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Grupos en los que estás inscrito actualmente
            </p>
          </div>

          <div className="space-y-3">
            {myGroups.map((m) => {
              const g = m.group

              return (
                <div key={m.id} className="rounded-lg border border-[#00C4CC]/30 bg-[#00C4CC]/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{g.name}</h3>
                        <LevelBadge level={g.level} />
                        {m.status === 'waitlist' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
                            Lista de espera
                          </span>
                        )}
                        {m.status === 'active' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00C4CC]/15 text-[#00C4CC]">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Entrenador: {g.coach?.full_name ?? '—'}
                      </p>
                      {g.schedules.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                          {g.schedules.map((s, i) => (
                            <span key={i} className="text-xs text-muted-foreground">
                              {i > 0 && '·'} {DAY_NAMES[s.day_of_week]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-xl">${Number(g.monthly_fee).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">/mes</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Available groups */}
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Grupos disponibles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Explora los grupos activos e inscríbete directamente
          </p>
        </div>

        {availableGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground text-sm">No hay grupos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableGroups.map((g) => {
              const isFull = g.activeMemberCount >= g.max_capacity
              const capacityPct = g.max_capacity > 0 ? (g.activeMemberCount / g.max_capacity) * 100 : 0

              return (
                <div key={g.id} className="rounded-lg border border-border bg-card p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{g.name}</h3>
                        <LevelBadge level={g.level} />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>Entrenador: <span className="text-foreground font-medium">{g.coach?.full_name ?? '—'}</span></span>
                      </div>

                      {/* Schedules */}
                      {g.schedules.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {(g.schedules as GroupSchedule[]).map((s, i) => (
                            <span key={i} className="text-xs text-muted-foreground">
                              {i > 0 && '·'} {DAY_NAMES[s.day_of_week]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Capacity bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-[#00C4CC]'}`}
                            style={{ width: `${Math.min(capacityPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {g.activeMemberCount}/{g.max_capacity}
                          {isFull ? (
                            <span className="ml-1 text-red-400">Lleno</span>
                          ) : (
                            <span className="ml-1 text-[#00C4CC]">{g.max_capacity - g.activeMemberCount} cupos libres</span>
                          )}
                        </span>
                      </div>

                      {isFull && g.waitlistCount > 0 && (
                        <p className="text-xs text-amber-400">
                          {g.waitlistCount} persona{g.waitlistCount !== 1 ? 's' : ''} en lista de espera
                        </p>
                      )}
                    </div>

                    {/* Price + action */}
                    <div className="text-right shrink-0 space-y-3">
                      <div>
                        <p className="font-bold text-2xl">${Number(g.monthly_fee).toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">/mes</p>
                      </div>
                      <JoinGroupButton groupId={g.id} myStatus={g.myStatus as 'active' | 'waitlist' | null} />
                    </div>
                  </div>

                  {isFull && !g.myStatus && (
                    <p className="text-xs text-muted-foreground border-t border-border pt-3">
                      El grupo está lleno. Al inscribirte quedarás en lista de espera y serás promovido automáticamente si se libera un cupo.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
