import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getTags } from '@/actions/exercises'
import { createExerciseAction } from '@/actions/exercises'
import { ExerciseForm } from '@/components/exercises/exercise-form'

export const metadata: Metadata = { title: 'Nuevo Ejercicio — Admin' }

export default async function AdminNewExercisePage() {
  const allTags = await getTags()

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/library"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Biblioteca
        </Link>
        <h1 className="text-2xl font-bold">Nuevo ejercicio</h1>
        <p className="text-muted-foreground text-sm mt-1">Completa los campos para añadir un ejercicio a la biblioteca</p>
      </div>

      <ExerciseForm action={createExerciseAction} allTags={allTags} />
    </div>
  )
}
