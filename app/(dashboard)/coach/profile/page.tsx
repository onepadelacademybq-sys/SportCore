import type { Metadata } from 'next'
import { BookOpen, Users, ClipboardList, LayoutList, Calendar, TrendingUp } from 'lucide-react'
import { getMyCoachProfile } from '@/actions/coach-profile'
import { AvatarUpload } from '@/components/coach/avatar-upload'
import { ProfileForm } from '@/components/coach/profile-form'
import { CertificationsPanel } from '@/components/coach/certifications-panel'
import { AvailabilityGrid } from '@/components/coach/availability-grid'
import type { CoachActivity } from '@/actions/coach-profile'

export const metadata: Metadata = { title: 'Mi Perfil — Entrenador' }

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-[#00C4CC]/10 flex items-center justify-center text-[#00C4CC]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        {sub && <p className="text-[10px] text-[#00C4CC] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ActivityPanel({ activity }: { activity: CoachActivity }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold px-0.5">Historial de actividad</h3>
      <div className="space-y-2">
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Clases impartidas"
          value={activity.total_classes}
          sub={activity.classes_this_month > 0 ? `+${activity.classes_this_month} este mes` : undefined}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Grupos activos"
          value={activity.active_groups}
          sub={activity.historical_groups > 0 ? `${activity.historical_groups} históricos` : undefined}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Jugadores entrenados"
          value={activity.total_players}
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Evaluaciones realizadas"
          value={activity.evaluations_count}
        />
        <StatCard
          icon={<LayoutList className="h-5 w-5" />}
          label="Mesociclos creados"
          value={activity.mesocycles_count}
        />
      </div>
    </div>
  )
}

export default async function CoachProfilePage() {
  const profile = await getMyCoachProfile()

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tu información profesional, formación y disponibilidad
        </p>
      </div>

      {/* Avatar + nombre */}
      <div className="rounded-lg border border-border bg-card p-4">
        <AvatarUpload
          userId={profile.id}
          currentUrl={profile.avatar_url}
          fullName={profile.full_name}
        />
      </div>

      {/* Main grid: form + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario — 2/3 */}
        <div className="lg:col-span-2">
          <ProfileForm profile={profile} />
        </div>

        {/* Actividad — 1/3 */}
        <div>
          <ActivityPanel activity={profile.activity} />
        </div>
      </div>

      {/* Certificaciones */}
      <CertificationsPanel certifications={profile.certifications} />

      {/* Disponibilidad */}
      <AvailabilityGrid availability={profile.availability} />
    </div>
  )
}
