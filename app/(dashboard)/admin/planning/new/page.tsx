import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createMesocycleAction } from '@/actions/training'
import { MesocycleForm } from '@/components/training/mesocycle-form'

export const metadata: Metadata = { title: 'Nuevo Mesociclo — Admin' }

export default function AdminNewMesocyclePage() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/planning"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Planificación
        </Link>
        <h1 className="text-2xl font-bold">Nuevo mesociclo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Se crearán automáticamente los microciclos según la duración indicada.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <MesocycleForm action={createMesocycleAction} />
      </div>
    </div>
  )
}
