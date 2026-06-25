import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getMacrocycleById, updateMacrocycleAction } from '@/actions/training'
import { MacrocycleForm } from '@/components/training/macrocycle-form'

export const metadata: Metadata = { title: 'Editar Macrociclo — Admin' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditMacrocyclePage({ params }: PageProps) {
  const { id } = await params
  const macro = await getMacrocycleById(id)
  if (!macro) notFound()

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div>
        <Link
          href={`/admin/planning/macro/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          {macro.name}
        </Link>
        <h1 className="text-2xl font-bold">Editar macrociclo</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <MacrocycleForm
          action={updateMacrocycleAction}
          macrocycleId={macro.id}
          defaultValues={{
            name:               macro.name,
            generalObjective:   macro.general_objective ?? undefined,
            startDate:          macro.start_date ?? undefined,
            endDate:            macro.end_date ?? undefined,
            athleteLevel:       macro.athlete_level ?? undefined,
            competitionType:    macro.competition_type ?? undefined,
            periodizationModel: macro.periodization_model ?? undefined,
            qualities:          macro.qualities,
          }}
        />
      </div>
    </div>
  )
}
