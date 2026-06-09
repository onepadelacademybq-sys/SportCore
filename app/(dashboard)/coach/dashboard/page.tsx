import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBookingDateTime } from '@/lib/format'
import { Users, Calendar, ClipboardList, CheckCircle, Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard — Entrenador' }

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default async function CoachDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const coachId = user!.id

  const now        = new Date()
  const nowIso     = now.toISOString()
  const weekEnd    = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: profile },
    { data: coachGroups },
    { count: weekSessionCount },
    { count: pendingEvalCount },
    { data: nextSession },
    { data: recentSessions },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', coachId).single(),

    // Grupos del coach con sus miembros activos
    supabase.from('training_groups')
      .select('id, name, schedules:group_schedules(day_of_week, start_time, end_time), members:group_members(status)')
      .eq('coach_id', coachId)
      .eq('status', 'active'),

    // Sesiones esta semana
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('status', 'confirmed')
      .gte('start_time', nowIso)
      .lte('start_time', weekEnd),

    // Evaluaciones incompletas (sin overall_score)
    supabase.from('evaluations').select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .is('overall_score', null),

    // Próxima sesión individual
    supabase.from('bookings')
      .select(`
        id, start_time, end_time,
        player:profiles!player_id(full_name),
        court:courts!court_id(name)
      `)
      .eq('coach_id', coachId)
      .eq('status', 'confirmed')
      .is('group_id', null)
      .gte('start_time', nowIso)
      .order('start_time', { ascending: true })
      .limit(1),

    // Últimas 3 sesiones completadas
    supabase.from('bookings')
      .select(`
        id, start_time, end_time, status,
        player:profiles!player_id(full_name),
        court:courts!court_id(name)
      `)
      .eq('coach_id', coachId)
      .in('status', ['completed', 'confirmed'])
      .lt('start_time', nowIso)
      .order('start_time', { ascending: false })
      .limit(3),
  ])

  const fullName = (profile as any)?.full_name ?? 'Entrenador'

  // Total jugadores en grupos del coach
  const assignedPlayers = ((coachGroups ?? []) as any[]).reduce((acc, g) => {
    const active = (g.members ?? []).filter(
      (m: any) => m.status === 'active' || m.status === 'pending_payment',
    ).length
    return acc + active
  }, 0)

  const next = (nextSession ?? [])[0] as any | undefined

  const kpis = [
    {
      label: 'Jugadores en mis grupos',
      value: assignedPlayers,
      icon: Users,
      color: 'text-[#00C4CC]',
      note: `${(coachGroups ?? []).length} grupo${(coachGroups ?? []).length !== 1 ? 's' : ''} activo${(coachGroups ?? []).length !== 1 ? 's' : ''}`,
    },
    {
      label: 'Sesiones esta semana',
      value: weekSessionCount ?? 0,
      icon: Calendar,
      color: 'text-emerald-400',
      note: 'próximos 7 días',
    },
    {
      label: 'Evaluaciones incompletas',
      value: pendingEvalCount ?? 0,
      icon: ClipboardList,
      color: pendingEvalCount ? 'text-amber-400' : 'text-muted-foreground',
      note: 'sin calificación final',
    },
    {
      label: 'Próxima sesión',
      value: next ? new Date(next.start_time).toLocaleString('es-CO', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '—',
      icon: Clock,
      color: next ? 'text-blue-400' : 'text-muted-foreground',
      note: next ? (next.player?.full_name ?? '') : 'Sin sesiones próximas',
    },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Bienvenido, {fullName}</h1>
          <span className="text-xs font-medium bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-full">
            Entrenador
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Gestión de jugadores y planificación de entrenamientos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, note }) => (
          <Card key={label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{label}</CardTitle>
              <Icon className={`h-4 w-4 shrink-0 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              {note && <p className="text-[10px] text-muted-foreground mt-0.5">{note}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mis grupos activos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Mis grupos activos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {((coachGroups ?? []) as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No tienes grupos asignados.</p>
            ) : (
              <div className="divide-y divide-border">
                {((coachGroups ?? []) as any[]).map((g) => {
                  const activeCount = (g.members ?? []).filter(
                    (m: any) => m.status === 'active' || m.status === 'pending_payment',
                  ).length
                  const days = [...new Set((g.schedules ?? []).map((s: any) => s.day_of_week as number))]
                    .sort()
                    .map((d) => DAY_NAMES[d as number])
                    .join(' · ')
                  return (
                    <div key={g.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{g.name}</p>
                        <span className="text-xs text-[#00C4CC] shrink-0">
                          {activeCount} jugador{activeCount !== 1 ? 'es' : ''}
                        </span>
                      </div>
                      {days && (
                        <p className="text-xs text-muted-foreground mt-0.5">{days}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas sesiones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              Últimas sesiones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {((recentSessions ?? []) as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Sin sesiones recientes.</p>
            ) : (
              <div className="divide-y divide-border">
                {((recentSessions ?? []) as any[]).map((b) => (
                  <div key={b.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {b.player?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBookingDateTime(b.start_time, b.end_time)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded ${
                      b.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-[#00C4CC]/10 text-[#00C4CC]'
                    }`}>
                      {b.status === 'completed' ? 'Completada' : 'Confirmada'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-3">
              <Link href="/coach/bookings" className="text-xs text-[#00C4CC] hover:underline">
                Ver todas mis sesiones →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
