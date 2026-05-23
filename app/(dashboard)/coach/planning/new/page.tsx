import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createMesocycleAction, getAssignmentTargets } from '@/actions/training'
import { MesocycleForm } from '@/components/training/mesocycle-form'

export const metadata: Metadata = { title: 'Nuevo Mesociclo — Entrenador' }

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

export default async function CoachNewMesocyclePage({ searchParams }: PageProps) {
  const { playerId, groupId } = await searchParams

  let targetLabel: string | undefined
  let backHref = '/coach/planning'

  if (playerId || groupId) {
    const targets = await getAssignmentTargets()
    if (playerId) {
      const player = targets.players.find((p) => p.id === playerId)
      if (!player) notFound()
      targetLabel = player.full_name
      backHref = `/coach/planning/player/${playerId}`
    } else if (groupId) {
      const group = targets.groups.find((g) => g.id === groupId)
      if (!group) notFound()
      targetLabel = group.name
      backHref = `/coach/planning/group/${groupId}`
    }
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          {targetLabel ?? 'Planificación'}
        </Link>
        <h1 className="text-2xl font-bold">Nuevo mesociclo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Se crearán automáticamente los microciclos según la duración indicada.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <MesocycleForm
          action={createMesocycleAction}
          playerId={playerId}
          groupId={groupId}
          targetLabel={targetLabel}
        />
      </div>
    </div>
  )
}
