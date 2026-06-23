import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAcademySettings } from '@/actions/settings'
import { GeneralSettingsForm } from '@/components/settings/general-settings-form'
import { ScheduleSettingsForm } from '@/components/settings/schedule-settings-form'
import { TerminologySettingsForm } from '@/components/settings/terminology-settings-form'
import { requireRole } from '@/lib/auth'

export const metadata: Metadata = { title: 'Configuración — Admin' }

export default async function SettingsPage() {
  await requireRole(['admin'])

  const settings = await getAcademySettings()
  if (!settings) redirect('/admin/dashboard')

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Administra los datos, horarios y preferencias de tu academia.
        </p>
      </div>

      <GeneralSettingsForm  data={settings} />
      <ScheduleSettingsForm data={settings} />
      <TerminologySettingsForm data={settings} />
    </div>
  )
}
