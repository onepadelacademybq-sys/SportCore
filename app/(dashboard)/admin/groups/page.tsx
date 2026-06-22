import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getGroups } from '@/actions/groups'
import { LevelBadge } from '@/components/groups/level-badge'
import { GroupStatusBadge } from '@/components/groups/group-status-badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Grupos de Entrenamiento — Admin' }

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatSchedules(schedules: { day_of_week: number; start_time: string; end_time: string }[]) {
  if (schedules.length === 0) return 'Sin horario definido'
  return schedules
    .map((s) => `${DAY_NAMES[s.day_of_week]} ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`)
    .join(', ')
}

export default async function AdminGroupsPage() {
  const groups = await getGroups()
  const now = new Date()
  const month = MONTH_NAMES[now.getMonth() + 1]

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Grupos de Entrenamiento</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión de grupos, cupos y financiamiento mensual
          </p>
        </div>
        <Link href="/admin/groups/new">
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Crear grupo
          </Button>
        </Link>
      </div>

      {/* Summary stats */}
      {groups.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Grupos activos',
              value: groups.filter((g) => g.status === 'active').length,
            },
            {
              label: 'Total jugadores',
              value: groups.reduce((acc, g) => acc + g.activeMemberCount, 0),
            },
            {
              label: 'En lista espera',
              value: groups.reduce((acc, g) => acc + g.waitlistCount, 0),
            },
            {
              label: `Ingresos esperados (${month})`,
              value: `$${groups
                .filter((g) => g.status === 'active')
                .reduce((acc, g) => acc + g.activeMemberCount * Number(g.monthly_fee), 0)
                .toLocaleString('es-ES')}`,
            },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground text-sm mb-4">Aún no hay grupos de entrenamiento.</p>
          <Link href="/admin/groups/new">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Crear el primer grupo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const capacityPct = g.max_capacity > 0 ? (g.activeMemberCount / g.max_capacity) * 100 : 0
            const expectedMonthly = g.activeMemberCount * Number(g.monthly_fee)

            return (
              <Link key={g.id} href={`/admin/groups/${g.id}`} className="block group">
                <div className="rounded-lg border border-border bg-card p-5 hover:border-brand/50 hover:bg-muted/10 transition-all">
                  <div className="flex items-start gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-base group-hover:text-brand transition-colors">
                          {g.name}
                        </h2>
                        <LevelBadge level={g.level} />
                        <GroupStatusBadge status={g.status} />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>
                          <span className="font-medium text-foreground">{g.coach?.full_name ?? '—'}</span>
                          {' '}· Entrenador
                        </span>
                        {g.default_court && (
                          <span>{g.default_court.name}</span>
                        )}
                        <span>{formatSchedules(g.schedules)}</span>
                      </div>

                      {/* Capacity bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[140px]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              capacityPct >= 100 ? 'bg-red-500' : capacityPct >= 80 ? 'bg-amber-500' : 'bg-brand'
                            }`}
                            style={{ width: `${Math.min(capacityPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {g.activeMemberCount}/{g.max_capacity} jugadores
                          {g.waitlistCount > 0 && (
                            <span className="ml-1 text-amber-400">
                              +{g.waitlistCount} espera
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Financial snapshot */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Tarifa mensual</p>
                      <p className="font-bold text-lg">${Number(g.monthly_fee).toFixed(0)}</p>
                      {g.activeMemberCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ${expectedMonthly.toLocaleString('es-ES')} esperados
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
