import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, Clock, UserCircle, CalendarDays } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb',
}

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  '5ta_masculino': { label: '5ta Masculino',    color: 'bg-blue-500/15 text-blue-400' },
  '6ta_masculino': { label: '6ta Masculino',    color: 'bg-indigo-500/15 text-indigo-400' },
  '7ma_masculino': { label: '7ma Masculino',    color: 'bg-violet-500/15 text-violet-400' },
  'femenino_d':    { label: 'Femenino D',       color: 'bg-pink-500/15 text-pink-400' },
  'femenino_c':    { label: 'Femenino C',       color: 'bg-rose-500/15 text-rose-400' },
  'juvenil_s18':   { label: 'Juvenil S18',      color: 'bg-emerald-500/15 text-emerald-400' },
  'juvenil_s16':   { label: 'Juvenil S16',      color: 'bg-teal-500/15 text-teal-400' },
  'juvenil_s14':   { label: 'Juvenil S14',      color: 'bg-cyan-500/15 text-cyan-400' },
  'prejuvenil':    { label: 'Prejuvenil (8-12)',color: 'bg-amber-500/15 text-amber-400' },
  'baby_padel':    { label: 'Baby Pádel (5-9)', color: 'bg-orange-500/15 text-orange-400' },
}

function fmtTime(t: string) {
  // "HH:MM:SS" → "HH:MM"
  return t.slice(0, 5)
}

function formatSchedules(schedules: Array<{ day_of_week: number; start_time: string; end_time: string }>) {
  if (!schedules.length) return null

  // Group consecutive days with the same time into ranges
  const sorted = [...schedules].sort((a, b) => a.day_of_week - b.day_of_week)

  // Group by time slot
  const byTime: Record<string, number[]> = {}
  for (const s of sorted) {
    const key = `${s.start_time}-${s.end_time}`
    byTime[key] = [...(byTime[key] ?? []), s.day_of_week]
  }

  return Object.entries(byTime).map(([key, days]) => {
    const [start, end] = key.split('-')
    const dayLabels = days.map((d) => DAYS[d] ?? d).join(', ')
    return `${dayLabels} · ${fmtTime(start)} – ${fmtTime(end)}`
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupRow = {
  id: string
  name: string
  level: string
  max_capacity: number
  monthly_fee: string
  notes: string | null
  coach: { full_name: string } | null
  schedules: Array<{ day_of_week: number; start_time: string; end_time: string }>
  members: Array<{ status: string }>
}

// ─── Component ────────────────────────────────────────────────────────────────

export async function GroupsSection() {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('training_groups')
    .select(`
      id, name, level, max_capacity, monthly_fee, notes,
      coach:profiles!coach_id(full_name),
      schedules:group_schedules(day_of_week, start_time, end_time),
      members:group_members(status)
    `)
    .eq('status', 'active')
    .order('name')

  const groups = (raw ?? []) as unknown as GroupRow[]

  return (
    <section id="grupos" className="py-24 px-6 bg-muted/10">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-xs text-brand uppercase tracking-widest font-semibold mb-3">
            Grupos activos
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Entrena con tu grupo
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Grupos reducidos por nivel con horario fijo semanal. Inscríbete y empieza a entrenar con
            jugadores de tu misma categoría.
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-8 py-16 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-heading text-lg font-semibold mb-2">Próximamente nuevos grupos</p>
            <p className="text-muted-foreground text-sm">
              Estamos preparando los próximos grupos de entrenamiento. Déjanos tus datos y te
              avisamos cuando estén disponibles.
            </p>
            <a
              href="#contacto"
              className="inline-flex items-center mt-6 text-sm text-brand hover:underline font-medium"
            >
              Avisar cuando haya cupos →
            </a>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((g) => {
              const activeMemberCount = g.members.filter((m) => m.status === 'active').length
              const available = g.max_capacity - activeMemberCount
              const levelCfg = LEVEL_CONFIG[g.level] ?? { label: g.level, color: 'bg-muted text-muted-foreground' }
              const scheduleLines = formatSchedules(g.schedules)
              const feeNum = parseFloat(g.monthly_fee)
              const fee = isNaN(feeNum) ? g.monthly_fee : `$${feeNum.toLocaleString('es-CO')}`

              return (
                <div
                  key={g.id}
                  className="rounded-2xl border border-border bg-card p-7 flex flex-col gap-5 hover:border-brand/30 transition-colors"
                >
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-heading text-base font-semibold leading-tight">{g.name}</h3>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${levelCfg.color}`}>
                        {levelCfg.label}
                      </span>
                    </div>

                    {/* Coach */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserCircle className="h-3.5 w-3.5" />
                      <span>{g.coach?.full_name ?? 'Entrenador por asignar'}</span>
                    </div>
                  </div>

                  {/* Schedules */}
                  {scheduleLines && scheduleLines.length > 0 && (
                    <div className="space-y-1.5">
                      {scheduleLines.map((line) => (
                        <div key={line} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-brand" />
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cupos */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>Máx. {g.max_capacity} jugadores</span>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      available <= 0
                        ? 'bg-destructive/10 text-destructive'
                        : available <= 1
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {available <= 0 ? 'Sin cupos' : `${available} cupo${available === 1 ? '' : 's'}`}
                    </span>
                  </div>

                  {/* Notes */}
                  {g.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                      {g.notes}
                    </p>
                  )}

                  {/* Price + CTA */}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <div>
                      <span className="font-heading text-2xl font-bold tabular-nums">{fee}</span>
                      <span className="text-xs text-muted-foreground ml-1">/mes</span>
                    </div>
                    <Link
                      href="/register"
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        available <= 0
                          ? 'border border-border text-muted-foreground cursor-not-allowed opacity-60 pointer-events-none'
                          : 'bg-brand text-black hover:bg-[#00b3ba]'
                      }`}
                    >
                      {available <= 0 ? 'Lista de espera' : 'Inscribirse'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </section>
  )
}
