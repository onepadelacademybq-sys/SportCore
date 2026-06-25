import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createMacrocycleAction } from '@/actions/training'
import { MacrocycleForm } from '@/components/training/macrocycle-form'

export const metadata: Metadata = { title: 'Nuevo Macrociclo — Admin' }

export default function AdminNewMacrocyclePage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/planning"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Planificación
        </Link>
        <h1 className="text-2xl font-bold">Nuevo macrociclo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Un macrociclo agrupa varios mesociclos en una temporada o ciclo anual.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <MacrocycleForm action={createMacrocycleAction} />
      </div>
    </div>
  )
}
