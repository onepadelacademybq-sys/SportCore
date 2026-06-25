import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBookingDateTime } from '@/lib/format'
import { Calendar, CheckCircle, Wallet, Star, Users, Clock } from 'lucide-react'
import { PADEL_LEVEL_LABELS_SHORT as LEVEL_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Dashboard — Jugador' }

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmada',  className: 'bg-brand/10 text-brand' },
  completed: { label: 'Completada',  className: 'bg-emerald-500/10 text-emerald-400' },
  pending:   { label: 'Pendiente',   className: 'bg-amber-500/10 text-amber-400' },
  paid:      { label: 'Pago enviado',className: 'bg-blue-500/10 text-blue-400' },
  cancelled: { label: 'Cancelada',   className: 'bg-muted text-muted-foreground' },
}

const MEMBER_STATUS: Record<string, { label: string; className: string }> = {
  active:          { label: 'Activo',          className: 'bg-brand/15 text-brand' },
  pending_payment: { label: 'Pago pendiente',  className: 'bg-orange-500/15 text-orange-400' },
  waitlist:        { label: 'Lista de espera', className: 'bg-amber-500/15 text-amber-400' },
}

export default async function PlayerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const playerId = user.id
  const nowIso   = new Date().toISOString()

  const [
    { data: profile },
    { count: completedCount },
    { data: wallet },
    { data: nextBookings },
    { data: recentBookings },
    { data: myGroups },
  ] = await Promise.all([
    supabase.from('profiles')
      .select('full_name, padel_level')
      .eq('id', playerId)
      .single(),

    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('status', 'completed'),

    supabase.from('class_wallet')
      .select('available_classes, total_classes, used_classes')
      .eq('player_id', playerId)
      .maybeSingle(),

    // Próximas reservas confirmadas
    supabase.from('bookings')
      .select(`
        id, start_time, end_time, status,
        coach:profiles!coach_id(full_name),
        court:courts!court_id(name)
      `)
      .eq('player_id', playerId)
      .eq('status', 'confirmed')
      .gte('start_time', nowIso)
      .order('start_time', { ascending: true })
      .limit(1),

    // Últimas 3 reservas (cualquier estado)
    supabase.from('bookings')
      .select(`
        id, start_time, end_time, status,
        coach:profiles!coach_id(full_name),
        court:courts!court_id(name)
      `)
      .eq('player_id', playerId)
      .order('start_time', { ascending: false })
      .limit(3),

    // Grupos en los que está inscrito
    supabase.from('group_members')
      .select(`
        id, status,
        group:training_groups(
          id, name, level,
          coach:profiles!coach_id(full_name),
          schedules:group_schedules(day_of_week, start_time, end_time)
        )
      `)
      .eq('player_id', playerId)
      .neq('status', 'inactive')
      .order('joined_at', { ascending: false }),
  ])

  const prof      = profile as any
  const fullName  = prof?.full_name ?? 'Jugador'
  const level     = prof?.padel_level ?? null
  const w         = wallet as any
  const nextClass = ((nextBookings ?? []) as any[])[0]

  const kpis = [
    {
      label: 'Próxima clase',
      value: nextClass
        ? new Date(nextClass.start_time).toLocaleString('es-CO', {
            weekday: 'short', day: 'numeric', month: 'short',
          })
        : 'Sin clases',
      sub: nextClass
        ? `${new Date(nextClass.start_time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })} · ${nextClass.coach?.full_name ?? ''}`
        : '—',
      icon: Calendar,
      color: nextClass ? 'text-brand' : 'text-muted-foreground',
    },
    {
      label: 'Sesiones completadas',
      value: completedCount ?? 0,
      sub: 'total histórico',
      icon: CheckCircle,
      color: 'text-emerald-400',
    },
    {
      label: 'Clases en E-wallet',
      value: w?.available_classes ?? 0,
      sub: w ? `${w.used_classes} usadas · ${w.total_classes} totales` : 'Sin billetera',
      icon: Wallet,
      color: 'text-amber-400',
    },
    {
      label: 'Nivel actual',
      value: level ? LEVEL_LABELS[level] ?? level : '—',
      sub: level ? 'categoría asignada' : 'sin clasificar',
      icon: Star,
      color: level ? 'text-purple-400' : 'text-muted-foreground',
    },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">Bienvenido, {fullName}</h1>
          <span className="text-xs font-medium bg-brand/15 text-brand px-2.5 py-1 rounded-full">
            Jugador
          </span>
          {level && (
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
              {LEVEL_LABELS[level] ?? level}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">Tu progreso y actividad en la academia</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{label}</CardTitle>
              <Icon className={`h-4 w-4 shrink-0 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold leading-tight ${color}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas reservas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Últimas reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {((recentBookings ?? []) as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No tienes reservas aún.</p>
            ) : (
              <div className="divide-y divide-border">
                {((recentBookings ?? []) as any[]).map((b) => {
                  const cfg = STATUS_CONFIG[b.status] ?? { label: b.status, className: 'bg-muted text-muted-foreground' }
                  return (
                    <div key={b.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {b.coach?.full_name ?? 'Entrenador no asignado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBookingDateTime(b.start_time, b.end_time)}
                        </p>
                        {b.court && (
                          <p className="text-xs text-muted-foreground">{b.court.name}</p>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="pt-3">
              <Link href="/player/bookings" className="text-xs text-brand hover:underline">
                Ver todas mis reservas →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Mis grupos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Mis grupos de entrenamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {((myGroups ?? []) as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No estás inscrito en ningún grupo.</p>
            ) : (
              <div className="divide-y divide-border">
                {((myGroups ?? []) as any[]).map((m) => {
                  const g   = m.group as any
                  const cfg = MEMBER_STATUS[m.status] ?? { label: m.status, className: 'bg-muted text-muted-foreground' }
                  const days = [...new Set(((g?.schedules ?? []) as any[]).map((s: any) => s.day_of_week as number))]
                    .sort()
                    .map((d) => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d])
                    .join(' · ')
                  return (
                    <div key={m.id} className="py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{g?.name ?? '—'}</p>
                          {days && (
                            <p className="text-xs text-muted-foreground mt-0.5">{days}</p>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="pt-3">
              <Link href="/player/groups" className="text-xs text-brand hover:underline">
                Ver grupos disponibles →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
