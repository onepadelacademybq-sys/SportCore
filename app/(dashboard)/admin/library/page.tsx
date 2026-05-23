import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Plus, Clock, BookOpen } from 'lucide-react'
import { getExercises } from '@/actions/exercises'
import { ThemeBadge } from '@/components/exercises/theme-badge'
import { FavoriteButton } from '@/components/exercises/favorite-button'
import { ExerciseFilters } from '@/components/exercises/exercise-filters'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Biblioteca de Ejercicios — Admin' }

const LEVEL_LABELS: Record<string, string> = {
  '5ta_masculino': '5ta Masc.',
  '6ta_masculino': '6ta Masc.',
  '7ma_masculino': '7ma Masc.',
  femenino_d: 'Fem. D',
  femenino_c: 'Fem. C',
  juvenil_s18: 'S18',
  juvenil_s16: 'S16',
  juvenil_s14: 'S14',
  prejuvenil: 'Prejuv.',
  baby_padel: 'Baby',
}

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

async function ExerciseGrid({ searchParams }: { searchParams: Record<string, string> }) {
  const exercises = await getExercises({
    theme:        searchParams.theme        || undefined,
    level:        searchParams.level        || undefined,
    search:       searchParams.search       || undefined,
    maxDuration:  searchParams.maxDuration  ? Number(searchParams.maxDuration) : undefined,
    favoritesOnly: searchParams.favoritesOnly === '1',
  })

  if (exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No se encontraron ejercicios con esos filtros.</p>
        <Link href="/admin/library/new" className="mt-4">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Crear el primero
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {exercises.map((ex) => (
        <div key={ex.id} className="relative group rounded-xl border border-border bg-card hover:border-primary/40 transition-colors flex flex-col">
          {/* Favorite */}
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton exerciseId={ex.id} isFavorite={ex.is_favorite} />
          </div>

          {/* Draft badge */}
          {!ex.is_published && (
            <div className="absolute top-3 left-3 z-10">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                Borrador
              </span>
            </div>
          )}

          <Link href={`/admin/library/${ex.id}`} className="flex flex-col flex-1 p-4 pt-10">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <ThemeBadge theme={ex.theme} />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {LEVEL_LABELS[ex.level] ?? ex.level}
              </span>
            </div>

            <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{ex.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{ex.objective}</p>

            <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {ex.estimated_duration_min} min
              {ex.tags.length > 0 && (
                <span className="ml-auto truncate max-w-[120px]">
                  {ex.tags.map((t) => t.name).join(', ')}
                </span>
              )}
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

export default async function AdminLibraryPage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca de Ejercicios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crea, organiza y publica ejercicios para los entrenadores
          </p>
        </div>
        <Link href="/admin/library/new">
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nuevo ejercicio
          </Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <ExerciseFilters />
      </Suspense>

      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      }>
        <ExerciseGrid searchParams={params} />
      </Suspense>
    </div>
  )
}
