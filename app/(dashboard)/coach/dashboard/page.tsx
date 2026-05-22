import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Dumbbell, ClipboardList, Calendar } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard — Entrenador' }

const STATS = [
  { label: 'Jugadores asignados', icon: Users, value: '—' },
  { label: 'Sesiones esta semana', icon: Dumbbell, value: '—' },
  { label: 'Evaluaciones pendientes', icon: ClipboardList, value: '—' },
  { label: 'Próxima sesión', icon: Calendar, value: '—' },
]

export default async function CoachDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const fullName = (data as { full_name?: string } | null)?.full_name ?? 'Entrenador'

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Bienvenido, {fullName}</h1>
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            Entrenador
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Gestión de jugadores y planificación de entrenamientos
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
            <CardTitle className="text-base">Mis jugadores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Próximamente — lista de jugadores asignados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan de entrenamientos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Próximamente — mesociclos y sesiones activas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
