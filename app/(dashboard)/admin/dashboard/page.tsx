import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBookingDateTime, formatCOP } from '@/lib/format'
import {
  Users, UserCog, Calendar, TrendingUp,
  Clock, CheckCircle, AlertCircle,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard — Admin' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today      = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)
  const nowIso     = today.toISOString()

  const [
    { data: profile },
    { count: playerCount },
    { count: coachCount },
    { count: pendingCount },
    { data: incomeRows },
    { data: upcomingBookings },
    { data: groups },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),

    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'player').eq('is_active', true),

    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('role', 'coach').eq('is_active', true),

    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'paid']),

    supabase.from('financial_transactions')
      .select('amount')
      .eq('type', 'income')
      .gte('date', monthStart)
      .lte('date', monthEnd),

    supabase.from('bookings')
      .select(`
        id, start_time, end_time, status,
        player:profiles!player_id(full_name),
        coach:profiles!coach_id(full_name),
        court:courts!court_id(name)
      `)
      .eq('status', 'confirmed')
      .gte('start_time', nowIso)
      .order('start_time', { ascending: true })
      .limit(5),

    supabase.from('training_groups')
      .select('id, name, max_capacity, members:group_members(status)')
      .eq('status', 'active')
      .order('name'),
  ])

  const fullName   = (profile as any)?.full_name ?? 'Admin'
  const monthIncome = (incomeRows ?? []).reduce((s, r) => s + Number(r.amount), 0)

  const groupsWithSlots = ((groups ?? []) as any[]).map((g) => {
    const occupied = (g.members ?? []).filter(
      (m: any) => m.status === 'active' || m.status === 'pending_payment',
    ).length
    return { ...g, available: g.max_capacity - occupied }
  }).filter((g) => g.available > 0)

  const kpis = [
    { label: 'Jugadores activos',    value: playerCount ?? 0,               icon: Users,    color: 'text-[#00C4CC]' },
    { label: 'Entrenadores',         value: coachCount ?? 0,                icon: UserCog,  color: 'text-blue-400'  },
    { label: 'Reservas pendientes',  value: pendingCount ?? 0,              icon: AlertCircle, color: pendingCount ? 'text-amber-400' : 'text-muted-foreground' },
    { label: `Ingresos ${today.toLocaleString('es-CO', { month: 'long' })}`, value: formatCOP(monthIncome), icon: TrendingUp, color: 'text-emerald-400' },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Bienvenido, {fullName}</h1>
          <span className="text-xs font-medium bg-red-500/15 text-red-400 px-2.5 py-1 rounded-full">
            Administrador
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">Resumen general de la academia</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{label}</CardTitle>
              <Icon className={`h-4 w-4 shrink-0 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas reservas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Próximas reservas confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {(upcomingBookings ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No hay reservas confirmadas próximas.</p>
            ) : (
              <div className="divide-y divide-border">
                {((upcomingBookings ?? []) as any[]).map((b) => (
                  <div key={b.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {b.player?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBookingDateTime(b.start_time, b.end_time)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Coach: {b.coach?.full_name ?? '—'}
                        {b.court ? ` · ${b.court.name}` : ''}
                      </p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            )}
            <div className="pt-3">
              <Link href="/admin/bookings" className="text-xs text-[#00C4CC] hover:underline">
                Ver todas las reservas →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Grupos con cupos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Grupos con cupos disponibles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {groupsWithSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Todos los grupos están llenos.</p>
            ) : (
              <div className="divide-y divide-border">
                {groupsWithSlots.map((g) => (
                  <div key={g.id} className="py-2.5 flex items-center justify-between gap-3">
                    <Link
                      href={`/admin/groups/${g.id}`}
                      className="text-sm font-medium hover:text-[#00C4CC] truncate"
                    >
                      {g.name}
                    </Link>
                    <span className="text-xs font-medium text-emerald-400 shrink-0">
                      {g.available} cupo{g.available !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-3">
              <Link href="/admin/groups" className="text-xs text-[#00C4CC] hover:underline">
                Ver todos los grupos →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
