import type { Metadata } from 'next'
import { getCoachSessions } from '@/actions/training'
import { CoachTrainingsDashboard } from '@/components/training/coach-trainings-dashboard'

export const metadata: Metadata = { title: 'Mis Entrenamientos — Entrenador' }

export default async function CoachTrainingsPage() {
  const sessions = await getCoachSessions()

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Mis Entrenamientos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Seguimiento de sesiones, asistencia y estado de tu planificación.
        </p>
      </div>

      <CoachTrainingsDashboard sessions={sessions} />
    </div>
  )
}
