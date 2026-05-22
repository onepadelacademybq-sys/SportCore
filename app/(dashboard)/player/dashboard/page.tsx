import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, ClipboardList, Calendar, Star } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard — Jugador' }

const STATS = [
  { label: 'Próxima sesión', icon: Calendar, value: '—' },
  { label: 'Sesiones completadas', icon: Dumbbell, value: '—' },
  { label: 'Evaluaciones realizadas', icon: ClipboardList, value: '—' },
  { label: 'Nivel actual', icon: Star, value: '—' },
]

export default async function PlayerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('profiles')
    .select('full_name, padel_level')
    .eq('id', user!.id)
    .single()

  const profile = data as { full_name?: string; padel_level?: string } | null
  const fullName = profile?.full_name ?? 'Jugador'
  const level = profile?.padel_level ?? null

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Bienvenido, {fullName}</h1>
          <span className="text-xs font-medium bg-[#00C4CC]/15 text-[#00C4CC] px-2.5 py-1 rounded-full">
            Jugador
          </span>
          {level && (
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full capitalize">
              {level}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Tu progreso y actividad en la academia
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, icon: Icon, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mi entrenamiento actual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Próximamente — mesociclo y sesiones asignadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mis evaluaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Próximamente — historial y evolución de KPIs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
